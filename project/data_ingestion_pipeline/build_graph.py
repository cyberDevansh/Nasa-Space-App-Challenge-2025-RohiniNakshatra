import json
import os
import openai
from langchain.text_splitter import RecursiveCharacterTextSplitter, Language
from pathlib import Path
from neo4j import GraphDatabase
from concurrent.futures import ThreadPoolExecutor

NEO4J_URI = "neo4j://127.0.0.1:7687"
NEO4J_USER = "neo4j"
NEO4J_PASSWORD = "123456789"

driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))

docs_path = Path("cleaned_data")
documents = {file.name: file.read_text(encoding="utf-8") for file in docs_path.glob("*.txt")}


def get_embedding(text):
    response = openai.Embedding.create(
        model="text-embedding-3-small",
        input=text
    )
    return response["data"][0]["embedding"]


def extract_entities(text):
    prompt = f"""
        Extract key scientific **entities** (topics, equipment, methods, institutions, research areas, techniques, gene, concept etc).

        Additionally extract separately:
        - "organisms": any organisms, plants, animals, species, etc that is a known organism.
        - "compounds": any chemical compounds, molecules, drugs, or chemical substances.
        - "contributors" = authors or contributors of the work.
        - "mentioned_persons" = people referenced/discussed but not contributors.
            (If someone is both, keep them in contributors only).
        
        Also:
        Return the final result as a JSON of strings only (no explanations, formatting, or additional text).

        Return JSON with this exact structure:
        {{
            "entities": ["entity1", "entity2", ...],
            "organisms": ["organism1", "organism2", ...],
            "compounds": ["compound1", "compound2", ...],
            "person": {{
                "contributors": ["contributor1", ...],
                "mentioned_persons": ["person1", ...]
            }}
        }}

        Text: {text}
    """

    response = openai.ChatCompletion.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0
    )

    content = response.choices[0].message["content"].strip()
    print(content)
    try:
        data = json.loads(content)
        entities = data.get("entities", [])
        organisms = data.get("organisms", [])
        compounds = data.get("compounds", [])
        persons = data.get("person", {"contributors": [], "mentioned_persons": []})
        return entities, organisms, compounds, persons
    except json.JSONDecodeError:
        return [], [], [], {"contributors": [], "mentioned_persons": []}


def add_document_with_entities(doc_name, text, entities, organisms, compounds, persons):

    splitter = RecursiveCharacterTextSplitter.from_language(language=Language.MARKDOWN, chunk_size=10000, chunk_overlap=500)
    sections = splitter.split_text(text)

    section_embeddings = [get_embedding(section) for section in sections]

    entity_embeddings = {e: get_embedding(e) for e in entities}
    organism_embeddings = {o: get_embedding(o) for o in organisms}
    compound_embeddings = {c: get_embedding(c) for c in compounds}
    contributor_embeddings = {p: get_embedding(p) for p in persons["contributors"]}
    mentioned_embeddings = {
        p: get_embedding(p) for p in persons["mentioned_persons"]
        if p not in persons["contributors"]
    }

    system_prompt = """You are an expert science summarizer for technical audiences. You will be provided with scientific publications (text, abstracts, sections, figures, and tables) related to NASA’s biological and physical sciences research. Your goal is to generate a detailed summary that condenses the paper without losing essential scientific content.

Requirements for the summary:
 - Preserve detail: Include study objectives, experimental design, methods, key results (including numerical or technical details), figures’ essence, and interpretations.
 - Maintain nuance: Capture hypotheses, debates, evidence, and limitations described in the paper.
 - Audience-focused: Write for scientists, mission planners, and managers—highlight applications and relevance for human, plant, or other living systems in space and for Moon/Mars exploration.
 - Readable structure: Use headings/subheadings (Study Objective, Methods, Key Findings, Implications, Future Directions) and bullet points only for multiple key findings. Keep paragraphs concise but detailed.
 - Avoid over-compression: Do not reduce sections to one or two sentences. Each subsection should retain sufficient information to understand what was done, why it matters, and how it was interpreted.
 - Technical accuracy: Preserve all important terminology, measurements, and figure references. Include explanation of any critical diagrams or experimental illustrations.
 - Figures and data: Briefly describe figures or tables when they add to understanding, including trends or conclusions, without omitting their significance.

Important Notes:
 - Include contrasting findings and debates if the paper discusses them.
 - Include information on diversity, specificity, phosphorylation, dimerization, or other key molecular/biochemical mechanisms where relevant.
 - Summaries should allow a reader to grasp the full scientific content and implications without reading the full paper, but still include enough detail to understand experimental reasoning, evidence, and context.
"""
    response = openai.ChatCompletion.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": text}
        ],
        temperature=0
    )

    summary = response.choices[0].message.content.strip()

    with driver.session() as session:
        session.run("""
        MERGE (d:Document {name:$name})
        SET d.text = $text, d.summary = $summary
        WITH d
            UNWIND $sections AS s
                CREATE (sec:Section {text: s.text, embedding: s.embedding})
                MERGE (d)-[:HAS_SECTION]->(sec)
            WITH d
        UNWIND $entities AS e
            MERGE (ent:Entity {name: e.name})
            SET ent.embedding = e.embedding
            MERGE (d)-[:MENTIONS]->(ent)
        WITH d
        UNWIND $organisms AS o
            MERGE (org:Organism {name: o.name})
            SET org.embedding = o.embedding
            MERGE (d)-[:MENTIONS_ORGANISM]->(org)
        WITH d
        UNWIND $compounds AS c
            MERGE (cmp:Compound {name: c.name})
            SET cmp.embedding = c.embedding
            MERGE (d)-[:MENTIONS_COMPOUND]->(cmp)
        WITH d
        UNWIND $contributors AS a
            MERGE (per:Person {name: a.name})
            SET per.embedding = a.embedding
            MERGE (d)-[:CONTRIBUTED_BY]->(per)
        WITH d
        UNWIND $mentioned AS m
            MERGE (mp:Person {name: m.name})
            SET mp.embedding = m.embedding
            MERGE (d)-[:MENTIONS_PERSON]->(mp)
        """,
        name=doc_name,
        text=text,
        summary=summary,
        sections=[{"text": s, "embedding": e} for s, e in zip(sections, section_embeddings)],
        entities=[{"name": k, "embedding": v} for k, v in entity_embeddings.items()],
        organisms=[{"name": k, "embedding": v} for k, v in organism_embeddings.items()],
        compounds=[{"name": k, "embedding": v} for k, v in compound_embeddings.items()],
        contributors=[{"name": k, "embedding": v} for k, v in contributor_embeddings.items()],
        mentioned=[{"name": k, "embedding": v} for k, v in mentioned_embeddings.items()]
        )

print("Uploading docs + entities + persons + organisms + compounds in parallel...")
def process_document(name, text):
    ents, orgs, cmps, persons = extract_entities(text)
    name = name.replace(".txt", "")
    add_document_with_entities(name, text, ents, orgs, cmps, persons)

with ThreadPoolExecutor(max_workers=4) as executor:
    futures = [executor.submit(process_document, name, text) for name, text in documents.items()]
    for future in futures:
        future.result()  

print("✅ All documents processed in parallel.")


def create_vector_index():
    with driver.session() as session:
        session.run("""
        CREATE VECTOR INDEX entity_embeddings IF NOT EXISTS 
        FOR (e:Entity) ON (e.embedding)
        OPTIONS {indexConfig: {`vector.dimensions`: 1536, `vector.similarity_function`: 'cosine'}}
        """)
        session.run("""
        CREATE VECTOR INDEX organism_embeddings IF NOT EXISTS 
        FOR (o:Organism) ON (o.embedding)
        OPTIONS {indexConfig: {`vector.dimensions`: 1536, `vector.similarity_function`: 'cosine'}}
        """)
        session.run("""
        CREATE VECTOR INDEX compound_embeddings IF NOT EXISTS 
        FOR (c:Compound) ON (c.embedding)
        OPTIONS {indexConfig: {`vector.dimensions`: 1536, `vector.similarity_function`: 'cosine'}}
        """)
        session.run("""
        CREATE VECTOR INDEX person_embeddings IF NOT EXISTS 
        FOR (p:Person) ON (p.embedding)
        OPTIONS {indexConfig: {`vector.dimensions`: 1536, `vector.similarity_function`: 'cosine'}}
        """)
        session.run("""
        CREATE VECTOR INDEX section_embeddings IF NOT EXISTS 
        FOR (sec:Section) ON (sec.embedding)
        OPTIONS {indexConfig: {`vector.dimensions`: 1536, `vector.similarity_function`: 'cosine'}}
        """)

create_vector_index()
print("✅ Vector indices created for Documents, Entities, Organisms, Compounds, and Persons")
