import pinecone
import openai

MODEL = "text-embedding-ada-002"

index = pinecone.Index("nb-ai")


def similar_examples_from_pinecone(question):
    """
    Query pinecone to get he relevant enums and examples
    """

    question_embedding = openai.Embedding.create(input=question, engine=MODEL)[
        'data'][0]['embedding']

    res = index.query([question_embedding], top_k=10,
                      include_metadata=True, filter={'purpose': 'question'})

    return res
