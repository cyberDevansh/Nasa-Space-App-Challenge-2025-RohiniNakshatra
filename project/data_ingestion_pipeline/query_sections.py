import openai
from neo4j import GraphDatabase

NEO4J_URI = "neo4j://127.0.0.1:7687"
NEO4J_USER = "neo4j"
NEO4J_PASSWORD = "123456789"

driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))

def get_embedding(text):
    response = openai.Embedding.create(
        model="text-embedding-3-small",
        input=text
    )
    return response["data"][0]["embedding"]

def search_sections(search_text, top_k=20):
    q_emb = get_embedding(search_text)
    with driver.session() as session:
        result = session.run("""
        CALL db.index.vector.queryNodes('section_embeddings', $top_k, $embedding)
        YIELD node AS section_node, score AS section_score
        MATCH (section_node)<-[:HAS_SECTION]-(doc:Document)
        RETURN doc, section_node, section_score
        """, parameters={
            "embedding": q_emb,
            "top_k": top_k
        })

        docs = {}
        for record in result:
            doc_name = record["doc"]["name"]
            section_text = record["section_node"]["text"]
            section_score = record["section_score"]
            if doc_name not in docs:
                docs[doc_name] = []
            docs[doc_name].append({
                "section_text": section_text,
                "score": section_score
            })

        final_results = []
        for doc_name, sections in docs.items():
            max_score = max([s['score'] for s in sections])
            best_section = max(sections, key=lambda s: s['score'])['section_text']
            final_results.append({
                "document": doc_name,
                "best_section": best_section,
                "max_score": max_score
            })

        final_results.sort(key=lambda x: x['max_score'], reverse=True)
        return final_results

if __name__ == "__main__":
    user_input = input("Enter query: ")
    results = search_sections(user_input)
    for r in results:
        print(f"✅ Document: {r['document']} | Best Section: {r['best_section'][:100]}... | Score: {r['max_score']:.3f}")
