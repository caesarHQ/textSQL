import discord
from tabulate import tabulate
from discord.ext import commands
from dotenv import load_dotenv
from os import getenv
import requests

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
    if message.author == bot.user:
        return

    if message.content.startswith('/ask'):
        user_message = str(message.content).lower()
        await message.channel.send(f"Working on: {message.content[4:].strip()}")

        natural_language_query = user_message.split('/ask ')[-1]
        response_data = await fetch_data(natural_language_query=natural_language_query)
        
        if (response_data.startswith("Sorry")):
            await message.channel.send(response_data)
            return

        await message.channel.send("\n " + message.author.mention +  "``` \n"+ response_data + "\n```")

async def fetch_data(natural_language_query): 
    url = "https://nba-gpt-prod.onrender.com/text_to_sql"

    payload = {"natural_language_query": natural_language_query, "scope": "sports"}
    headers = {"Content-Type": "application/json"}

    response = requests.post(url, json=payload, headers=headers)

    if response.json()["result"] is None: 
        return "Sorry, I couldn't find any results for that query"
        
    data = response.json()["result"]["results"]
    column_names = response.json()["result"]["column_names"]

    table_data = [[d.get(col, "") for col in column_names] for d in data]
    table = tabulate(table_data, headers=column_names)

    return table

bot.run(BOT_TOKEN)
