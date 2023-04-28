import pinecone
import openai
from app.config import PINECONE_INDEX

MODEL = "text-embedding-ada-002"


def similar_examples_from_pinecone(question):
    """
    Query pinecone to get he relevant enums and examples
    """
    if not PINECONE_INDEX:
        return []

    index = pinecone.Index(PINECONE_INDEX)

    res = index.query([0]*1536, top_k=10000,
                      include_metadata=True, filter={'purpose': 'example'})

    question_embedding = openai.Embedding.create(input=question, engine=MODEL)[
        'data'][0]['embedding']

    res = index.query([question_embedding], top_k=10,
                      include_metadata=True, filter={'purpose': 'example'})

    formatted_results = [
        {'sql': x['id'], 'query':x['metadata'].get('query', '')} for x in res['matches']]

    return formatted_results
