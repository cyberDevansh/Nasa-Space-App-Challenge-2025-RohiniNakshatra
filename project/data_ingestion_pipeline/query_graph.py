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

def search_documents(search_text, top_k=20):
    q_emb = get_embedding(search_text)
    with driver.session() as session:
        result = session.run("""
        // Entity matches
        CALL db.index.vector.queryNodes('entity_embeddings', $top_k, $embedding)
        YIELD node AS entity_node, score AS entity_score
        MATCH (entity_node)<-[:MENTIONS]-(doc_entity:Document)
        WITH doc_entity AS doc, collect({type:'entity', name: entity_node.name, 
             score: CASE WHEN entity_node.name = $query THEN 100.0 ELSE entity_score END}) AS matches
        RETURN doc, matches
        UNION ALL
        // Organism matches
        CALL db.index.vector.queryNodes('organism_embeddings', $top_k, $embedding)
        YIELD node AS org_node, score AS org_score
        MATCH (org_node)<-[:MENTIONS_ORGANISM]-(doc_org:Document)
        WITH doc_org AS doc, collect({type:'organism', name: org_node.name, 
             score: CASE WHEN org_node.name = $query THEN 100.0 ELSE org_score END}) AS matches
        RETURN doc, matches
        UNION ALL
        // Compound matches
        CALL db.index.vector.queryNodes('compound_embeddings', $top_k, $embedding)
        YIELD node AS cmp_node, score AS cmp_score
        MATCH (cmp_node)<-[:MENTIONS_COMPOUND]-(doc_cmp:Document)
        WITH doc_cmp AS doc, collect({type:'compound', name: cmp_node.name, 
             score: CASE WHEN cmp_node.name = $query THEN 100.0 ELSE cmp_score END}) AS matches
        RETURN doc, matches
        UNION ALL
        // Person matches
        CALL db.index.vector.queryNodes('person_embeddings', $top_k, $embedding)
        YIELD node AS person_node, score AS person_score
        MATCH (person_node)<-[:CONTRIBUTED_BY|MENTIONS_PERSON]-(doc_person:Document)
        WITH doc_person AS doc, collect({type:'person', name: person_node.name, 
             score: CASE WHEN person_node.name = $query THEN 100.0 ELSE person_score END}) AS matches
        RETURN doc, matches
        """, parameters={
            "embedding": q_emb,
            "top_k": top_k,
            "query": search_text
        })

        docs = {}
        for record in result:
            doc_name = record["doc"]["name"]
            matches = record["matches"]
            if doc_name not in docs:
                docs[doc_name] = []
            docs[doc_name].extend(matches)

        final_results = []
        for doc_name, items in docs.items():
            max_score = max([m['score'] for m in items])
            names = [m['name'] for m in items]
            final_results.append({
                "document": doc_name,
                "matched_items": names,
                "max_score": max_score
            })

        final_results.sort(key=lambda x: x['max_score'], reverse=True)
        return final_results

if __name__ == "__main__":
    user_input = input("Enter query: ")
    results = search_documents(user_input)
    for r in results:
        items = ", ".join(r['matched_items'])
        print(f"✅ Document: {r['document']} | Matched Entities/Organisms/Compounds/Persons: {items} | Score: {r['max_score']:.3f}")
