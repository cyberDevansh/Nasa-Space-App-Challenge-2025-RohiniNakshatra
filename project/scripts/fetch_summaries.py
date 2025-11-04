from neo4j import GraphDatabase
import os

NEO4J_URI = os.environ.get('NEO4J_URI', 'neo4j://127.0.0.1:7687')
NEO4J_USER = os.environ.get('NEO4J_USER', 'neo4j')
NEO4J_PASSWORD = os.environ.get('NEO4J_PASSWORD', '123456789')

def main(limit=200, preview_chars=800):
    driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
    try:
        with driver.session() as session:
            query = "MATCH (d:Document) WHERE d.summary IS NOT NULL RETURN d.name AS name, d.summary AS summary LIMIT $limit"
            result = session.run(query, limit=limit)

            rows = list(result)
            if not rows:
                print('No Document nodes with a `summary` property were found.')
                return

            for rec in rows:
                name = rec['name']
                summary = rec['summary'] or ''
                print('=' * 80)
                print(f"Document: {name}")
                print('-' * 80)
                print(summary[:preview_chars])
                if len(summary) > preview_chars:
                    print('\n... (truncated)')
                print()
    finally:
        driver.close()


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description='Fetch and preview Document summaries from Neo4j')
    parser.add_argument('--limit', type=int, default=200, help='Maximum number of summaries to fetch')
    parser.add_argument('--preview', type=int, default=800, help='Number of chars to show per summary')
    args = parser.parse_args()
    main(limit=args.limit, preview_chars=args.preview)
