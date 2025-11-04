from neo4j import GraphDatabase
from django.conf import settings

class Neo4jConnection:
    def __init__(self):
        self._driver = GraphDatabase.driver(
            settings.NEO4J_URI,
            auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD)
        )

    def close(self):
        if self._driver:
            self._driver.close()

if __name__ == "__main__":
    connection = Neo4jConnection()
    result = connection.query("MATCH (n) RETURN n LIMIT 10")
    print(result)
    connection.close()