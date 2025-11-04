from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from nasa_publication_tool.wsgi import neo4j_connection
import openai


class ListCategoriesView(APIView):
    def get(self, request):
        try:
            with neo4j_connection._driver.session() as session:
                # Run the query to list all node types (labels)
                result = session.run("CALL db.labels() YIELD label WHERE label <> 'Section' RETURN label")
                categories = [record["label"] for record in result]

                return Response({"categories": categories})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GetCategoryView(APIView):
    def get(self, request, pk):
        try:
            with neo4j_connection._driver.session() as session:
                query = f"MATCH (n:`{pk}`) RETURN n"
                records = session.run(query)

                nodes = []
                for record in records:
                    node = record["n"]

                    # ✅ Filter out 'embedding' from properties
                    props = {k: v for k, v in node.items() if k != "embedding"}

                    node_data = {
                        "id": node.id,
                        "labels": list(node.labels),
                        "properties": props
                    }
                    nodes.append(node_data)

            response = {
                "category_name": pk,
                "data": nodes
            }

            return Response(response)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ListDocumentsView(APIView):
    def get(self, request):
        category = request.GET.get("category")
        name = request.GET.get("name")

        if not category or not name:
            return Response({"error": "Both 'category' and 'name' parameters are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with neo4j_connection._driver.session() as session:
                # ⚠️ Use backticks and parameterized queries to prevent Cypher injection
                query = f"""
                MATCH (e:`{category}` {{name: $name}})--(connected)
                RETURN connected
                """
                result = session.run(query, name=name)

                # Extract connected nodes
                connected_nodes = []
                for record in result:
                    connected_node = record["connected"]
                    connected_nodes.append(
                        connected_node.get("name")
                    )

            response = {
                "category": category,
                "name": name,
                "documents": connected_nodes
            }

            return Response(response,status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
class ListAllDocumentsView(APIView):
    def get(self, request):
        try:
            with neo4j_connection._driver.session() as session:
                # Query to fetch all Document nodes
                query = "MATCH (doc:Document) RETURN doc"
                result = session.run(query)

                # Extract document names
                documents = []
                for record in result:
                    doc_node = record["doc"]
                    documents.append(doc_node.get("name"))

            return Response({"documents": documents},status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ListSummariesView(APIView):
    """Return documents that have pre-generated summaries stored on the Document node.
    Expected response: { "summaries": [ { "name": str, "summary": str }, ... ] }
    """
    def get(self, request):
        try:
            with neo4j_connection._driver.session() as session:
                query = "MATCH (doc:Document) WHERE doc.summary IS NOT NULL RETURN doc"
                result = session.run(query)

                summaries = []
                for record in result:
                    doc_node = record["doc"]
                    summaries.append({
                        "name": doc_node.get("name"),
                        "summary": doc_node.get("summary"),
                    })

            return Response({"summaries": summaries}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class GetDocumentView(APIView):
    def get(self, request):
        doc_name = request.GET.get('doc_name')
        if not doc_name:
            return Response({'error': 'Document name is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with neo4j_connection._driver.session() as session:
                query = """
                MATCH (d:Document {name: $doc_name})
                RETURN d
                """
                result = session.run(query, doc_name=doc_name)
                document = result.single()

                if document:
                    return Response({'document': document['d']}, status=status.HTTP_200_OK)
                else:
                    return Response({'error': 'Document not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SearchByNodesView(APIView):
    def get(self, request):
        search_text = request.GET.get("search_text")
        top_k = int(request.GET.get("top_k", 20))

        if not search_text:
            return Response({"error": "'search_text' parameter is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Generate embedding for the search text
            embedding = self.get_embedding(search_text)

            with neo4j_connection._driver.session() as session:
                # Query Neo4j for matching documents
                query = """
                CALL db.index.vector.queryNodes('entity_embeddings', $top_k, $embedding)
                YIELD node AS entity_node, score AS entity_score
                MATCH (entity_node)<-[:MENTIONS]-(doc_entity:Document)
                WITH doc_entity AS doc, collect({type:'entity', name: entity_node.name, 
                     score: CASE WHEN entity_node.name = $query THEN 100.0 ELSE entity_score END}) AS matches
                RETURN doc, matches
                UNION ALL
                CALL db.index.vector.queryNodes('organism_embeddings', $top_k, $embedding)
                YIELD node AS org_node, score AS org_score
                MATCH (org_node)<-[:MENTIONS_ORGANISM]-(doc_org:Document)
                WITH doc_org AS doc, collect({type:'organism', name: org_node.name, 
                     score: CASE WHEN org_node.name = $query THEN 100.0 ELSE org_score END}) AS matches
                RETURN doc, matches
                UNION ALL
                CALL db.index.vector.queryNodes('compound_embeddings', $top_k, $embedding)
                YIELD node AS cmp_node, score AS cmp_score
                MATCH (cmp_node)<-[:MENTIONS_COMPOUND]-(doc_cmp:Document)
                WITH doc_cmp AS doc, collect({type:'compound', name: cmp_node.name, 
                     score: CASE WHEN cmp_node.name = $query THEN 100.0 ELSE cmp_score END}) AS matches
                RETURN doc, matches
                UNION ALL
                CALL db.index.vector.queryNodes('person_embeddings', $top_k, $embedding)
                YIELD node AS person_node, score AS person_score
                MATCH (person_node)<-[:CONTRIBUTED_BY|MENTIONS_PERSON]-(doc_person:Document)
                WITH doc_person AS doc, collect({type:'person', name: person_node.name, 
                     score: CASE WHEN person_node.name = $query THEN 100.0 ELSE person_score END}) AS matches
                RETURN doc, matches
                """
                result = session.run(query, parameters={"embedding":embedding , "top_k":top_k, "query":search_text })

                # Aggregate results per document
                docs = {}
                for record in result:
                    doc_name = record["doc"]["name"]
                    matches = record["matches"]
                    if doc_name not in docs:
                        docs[doc_name] = []
                    docs[doc_name].extend(matches)

                # Compute max score per document
                final_results = []
                for doc_name, items in docs.items():
                    max_score = max([m['score'] for m in items])
                    final_results.append({
                        "document": doc_name,
                        "max_score": max_score
                    })

                # Sort by max_score descending
                final_results.sort(key=lambda x: x['max_score'], reverse=True)

            return Response({"results": final_results}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def get_embedding(self, text):
        response = openai.Embedding.create(
            model="text-embedding-3-small",
            input=text
        )
        return response["data"][0]["embedding"]