# from django.shortcuts import render
# from rest_framework.decorators import api_view
# from rest_framework.response import Response
# from neo4j import GraphDatabase
# import openai
# from nasa_publication_tool.wsgi import neo4j_connection

# def get_embedding(text):
#     response = openai.Embedding.create(
#         model="text-embedding-3-small",
#         input=text
#     )
#     return response["data"][0]["embedding"]

# @api_view(['POST'])
# def query_and_generate(request):
#     user_query = request.data.get('query', '')
#     if not user_query:
#         return Response({"error": "Query parameter is required."}, status=400)

#     # Get embedding for the user query
#     q_emb = get_embedding(user_query)

#     # Perform semantic search on section nodes
#     with neo4j_connection._driver.session() as session:
#         result = session.run(
#             """
#             CALL db.index.vector.queryNodes('section_embeddings', $top_k, $embedding)
#             YIELD node AS section_node, score AS section_score
#             MATCH (section_node)<-[:HAS_SECTION]-(doc:Document)
#             RETURN doc, section_node, section_score
#             """,
#             parameters={"embedding": q_emb, "top_k": 5}
#         )

#         sections = []
#         for record in result:
#             doc_name = record["doc"]["name"]
#             section_text = record["section_node"]["text"]
#             sections.append({"doc_name": doc_name, "section_text": section_text})

#     # Pass the sections and user query to the LLM
#     llm_input = "\n\n".join([s["section_text"] for s in sections])
#     llm_response = openai.Completion.create(
#         model="gpt-4o-mini",
#         prompt=f"""
#         You are an expert research assistant and summarizer. You will be provided with:

# Sections: A set of numbered or unnumbered sections. Some may be relevant to the query, some may not.
# User Query: A question or instruction from the user.
# Your task is to generate an accurate, clear, and detailed response using only the sections that are relevant to the query.

# Instructions:

#  - Identify relevance: Before answering, determine which sections contain information pertinent to the query. Ignore sections that are irrelevant.
#  - Use only relevant sections: Do not use any information from irrelevant sections or outside knowledge.
#  - Answer fully: Synthesize information from all relevant sections to provide a complete and accurate response.

# Maintain clarity and structure:
#  - Use headings, paragraphs, or bullet points if it improves readability.
#  - Reference the sections when helpful (e.g., “According to Section 3…”).
#  - Preserve meaning and technical details: Include important terms, numbers, or experimental results as provided.
#  - Concise but complete: Avoid unnecessary repetition but do not over-compress.
#  - Acknowledge gaps: If the relevant sections do not fully answer the query, clearly indicate which parts are missing or uncertain.

# Sections:  
# {sections}  

# Query:  
# {user_query}

# Output: Provide a comprehensive answer based strictly on the relevant sections above.
#         """,
#         max_tokens=200
#     )

#     generated_output = llm_response["choices"][0]["text"].strip()

#     # Return the response
#     return Response({
#         "query": user_query,
#         "generated_output": generated_output,
#         "documents": list(set([s["doc_name"] for s in sections]))  # Ensure unique document names
#     })


from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from neo4j import GraphDatabase
import openai
from nasa_publication_tool.wsgi import neo4j_connection

def get_embedding(text):
    response = openai.Embedding.create(
        model="text-embedding-3-small",
        input=text
    )
    return response["data"][0]["embedding"]

@api_view(['POST'])
def query_and_generate(request):
    user_query = request.data.get('query', '')
    if not user_query:
        return Response({"error": "Query parameter is required."}, status=400)

    # Get embedding for the user query
    q_emb = get_embedding(user_query)

    # Perform semantic search on section nodes
    with neo4j_connection._driver.session() as session:
        result = session.run(
            """
            CALL db.index.vector.queryNodes('section_embeddings', $top_k, $embedding)
            YIELD node AS section_node, score AS section_score
            MATCH (section_node)<-[:HAS_SECTION]-(doc:Document)
            RETURN doc, section_node, section_score
            """,
            parameters={"embedding": q_emb, "top_k": 10}
        )

        sections = []
        for record in result:
            doc_name = record["doc"]["name"]
            section_text = record["section_node"]["text"]
            sections.append({"doc_name": doc_name, "section_text": section_text})

    # Pass the sections and user query to the LLM
    llm_input = "\n\n".join([s["section_text"] for s in sections])
    publication = list(set([s["doc_name"] for s in sections]))
    llm_response = openai.Completion.create(
        model="gpt-4o-mini",
        prompt=f"""
You are an expert research assistant and summarizer. You will receive:

Publication: The name or title of the publication from which all sections are extracted.
Sections: A list of numbered or unnumbered text sections. Some may be relevant to the query, others not.
Query: A user question or instruction.
Your Task:
 - Provide a clear, accurate, and detailed answer only using information from relevant sections.

Guidelines:
 - Relevance: Identify and use only sections that directly relate to the query. Ignore irrelevant ones completely.
 - Accuracy: Synthesize details from all relevant sections without adding external knowledge.
 - Clarity: Use headings, paragraphs, or bullet points for readability and reference sections where useful (e.g., “According to Section 2…”).
 - Completeness: Include key terms, data, and results without unnecessary repetition.
 - Gaps: If the sections don’t fully answer the query, then respond that you are not able to find information relevant to the query in the publications for that part and answer the rest of the query.

Output format:
 - Keep the response 5–10 lines long, expanding slightly for complex queries.
 - Write the final response directly in Markdown syntax (no fenced code blocks like ```markdown).

Publication:
{publication}

Sections:
{sections}

Query:
{user_query}

Output:
 - A comprehensive Markdown-formatted answer based strictly on relevant sections.

        """, temperature=0, max_tokens=5000
    )
    # print("LLM response:", llm_response)

    generated_output = llm_response["choices"][0]["text"].strip()

    # Return the response
    return Response({
        "query": user_query,
        "generated_output": generated_output,
        "Publication": publication  # Ensure unique document names
    })