import discord
import time
from tabulate import tabulate
from discord.ext import commands
from dotenv import load_dotenv
from os import getenv
import requests
import json
import pandas as pd
import random
from utils import (expand_acronyms, generate_table_image, format_success_message,
                   format_intermidiate_message, send_raw_data_as_csv, is_message_inside_thread, format_sql_query)

BASE_API = 'https://nba-gpt-prod.onrender.com'
# BASE_API = 'http://localhost:9000'

class BufferedJSONDecoder:
    def __init__(self):
        self.buffer = ''
        self.decoder = json.JSONDecoder()

    def decode(self, data):
        self.buffer += data
        try:
            while self.buffer:
                obj, index = self.decoder.raw_decode(self.buffer)
                self.buffer = self.buffer[index:].lstrip()
                yield obj
        except json.JSONDecodeError:
            pass

decoder = BufferedJSONDecoder()

load_dotenv()

BOT_TOKEN = getenv("BOT_TOKEN")

intents = discord.Intents.default()

intents.guilds = True
intents.messages = True
intents.message_content = True

bot = commands.Bot(command_prefix="/", intents=intents)

@bot.event
async def on_ready():
    print(f'We have logged in as {bot.user}')

@bot.event
async def on_message(message):
    try:
        if message.author == bot.user:
            return
        
        if message.content.startswith('/help'):
            await handle_help(message)
            return

        if bot.user.mentioned_in(message):
            await process_mentioned_message(message)
            return
           
    except Exception as e:
        print(f"\n Error in on_message: {e}")
        await message.channel.send(f"Sorry, something went wrong. \n {e}")

async def process_mentioned_message(message):
    # Remove the bot @ from the message content
    nlq = message.clean_content.replace(f"@{bot.user.name}", "").strip().lower()
    print('\n NATURAL LANGUAGE QUERY', nlq)

    # Handle help command
    if nlq.startswith("help"):
        await handle_help(message)
        return 

    # Send message that you're working on the query
    intermediary_bot_response = await message.channel.send(f"Working on: ** {nlq} **")

    start_time = time.time()

    enriched_nlq = expand_acronyms(nlq)
    print('\n ENRICHED NATURAL LANGUAGE QUERY', nlq)

    # Call Text to SQL backend and update discord with the results
    response = await process_request(enriched_nlq, intermediary_bot_response, message.author.mention)

    time_taken =  "\nTime: "+ str(round(time.time() - start_time, 2)) + " seconds"

    if (response is None or response.get('status') != 'success'):
        await message.channel.send("Sorry! Couldn't get an answer for that :(")
        return
    
    if (is_empty_table(response["response"])):
        await message.channel.send("Returned an empty table :(")
        return 

    table_image = generate_table_image(response['response'], nlq)

    final_bot_response = await intermediary_bot_response.channel.send(content=f"Asked by: {message.author.mention}{time_taken}", file=table_image)

    #delete intermidiary messages
    await intermediary_bot_response.delete()

    # Add emoji reactions to the message
    await final_bot_response.add_reaction("👍")
    await final_bot_response.add_reaction("👎")
    
    # if original message was inside a thread, send everything in it. otherwise make a new thread
    if is_message_inside_thread(message):
        # raw data as csv
        await send_raw_data_as_csv(response["response"], final_bot_response.channel)
        # SQL query 
        sql_query = format_sql_query(response)
        await final_bot_response.channel.send(sql_query)
    else:
        # Create a thread 
        thread = await final_bot_response.create_thread(name=nlq[:95], auto_archive_duration=60)

        # register thread to the backend
        register_thread_session_to_backend(thread.id, response['session_id'])

        # Send raw data as csv in thread
        await send_raw_data_as_csv(response["response"], thread)

        # Reply with SQL query in the thread
        sql_query = format_sql_query(response)
        await thread.send(sql_query)
    
def register_thread_session_to_backend(thread_id, session_id):
    url = BASE_API + "/register_thread"

    payload = {"thread_id": thread_id, "session_id": session_id, "app_name": "discord"}
    headers = {"Content-Type": "application/json"}

    _ = requests.post(url, json=payload, headers=headers)
    return 

async def handle_help(message):
    example_queries = [
        "What is Steph Curry's 3pt percentage at home vs away?",
        "Who has the most triple-doubles in NBA history?",
        "What is the average points per game for LeBron James?",
        "Which team has the highest win percentage this season?",
        "What is the all-time record for most points scored in a single NBA game?",
    ]

    random_query = random.choice(example_queries)
    
    help_text = f"""
Use GPT to analyze NBA stats.

**Every Game, Every Play, Every Player** since the year 2000.

Try: `{random_query}`"""

    await message.channel.send(content=help_text)
    return

async def process_request(nlq, bot_response, author): 
    start_time = time.time()

    url = BASE_API + "/text_to_sql"
    payload = {
        "natural_language_query": nlq,
        "scope": "sports",
        "stream": True,
        "thread_id": bot_response.channel.id if is_message_inside_thread(bot_response) else None
    }
    
    obj = {}

    #streaming backend response
    for res in requests.post(url, json=payload, stream=True):
        for obj in decoder.decode(res.decode()):
            # each step in the stream
            current_time = time.time()
            time_taken =  "\nTime: "+ str(round(current_time - start_time, 2)) + " seconds"
            
            print('\n intermediate parsed json:', obj)
            print('\n status', obj.get('status'))
            await handle_response(obj, bot_response, nlq, author, time_taken)
    
    final_response = obj

    return final_response

def is_empty_table(result):
    df = pd.DataFrame(result["results"], columns=result['column_names'])
    return df.empty

async def handle_response(response_object, bot_response, nlq, author, time_taken):
    if (response_object.get('status') == 'success'):
        # Update discord with final results 
        success_message = format_success_message(nlq, author, time_taken)
        await bot_response.edit(content=success_message)
        return
    
    if (response_object.get('state').lower().startswith('error')):
        return

    # Update discord with intermediate step
    intermediate_message = format_intermidiate_message(response_object['state'], nlq, time_taken)
    await bot_response.edit(content=intermediate_message)

bot.run(BOT_TOKEN)
