import discord
import time
from tabulate import tabulate
from discord.ext import commands
from discord import File
from dotenv import load_dotenv
from os import getenv
import requests
import json
import pandas as pd
import io
import matplotlib.pyplot as plt
import textwrap

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
    if message.author == bot.user:
        return

    if message.content.startswith('/table'):
         # Sample DataFrame
        data = {
            'lebron_3pt_percentage': [0.342625, 0.642625],
            'lebron_3pt_attempts': [7892, 533256],
            'lebron_avg_points_per_game': [26.7855, 535.7855],
            'lebron_total_games_played': [1734, 35135]
        }
        df = pd.DataFrame(data)

        # changes the column names from 'lebron_3pt_percentage'  -> 'lebron 3pt percentage' so that the text can wrap without overflowing
        df.columns = [' '.join(col.split('_')) for col in df.columns]

        # Create a table plot
        fig, ax = plt.subplots()
        ax.axis('off')
        ax.axis('tight')  # Remove extra whitespace
        table = ax.table(cellText=df.values, colLabels=df.columns, cellLoc='center', loc='center', bbox=[0, 0, 1, 1])

        # Add table title
        title_text = "Lebron stats"
        ax.set_title(title_text, fontsize=16, fontweight='bold', pad=20)

        # Customize table appearance
        table.auto_set_font_size(False)
        table.set_fontsize(14)

        # Adjust column widths
        adjust_column_width(ax, table, fig, df)

        # Save the table plot to a buffer
        buf = io.BytesIO()
        plt.savefig(buf, format='png', bbox_inches='tight', dpi=300)  # Increase dpi for better quality
        buf.seek(0)

        # Send the table image as a file
        image_file = File(buf, filename='table.png')
        await message.channel.send(file=image_file)

        # Close the buffer and clear the plot
        buf.close()
        plt.clf()

    if message.content.startswith('/plot_data'):
        # Sample DataFrame
        data = {
            'Category': ['A', 'B', 'C', 'D'],
            'Values': [25, 50, 75, 100]
        }
        df = pd.DataFrame(data)

        # Plot the data
        ax = df.plot.bar(x='Category', y='Values', rot=0)
        plt.ylabel('Values')

        # Save the plot to a buffer
        buf = io.BytesIO()
        plt.savefig(buf, format='png')
        buf.seek(0)

        # Send the plot image as a file
        image_file = File(buf, filename='plot.png')
        await message.channel.send(file=image_file)

        # Close the buffer and clear the plot
        buf.close()
        plt.clf()

    # Check if the message @s the bot
    if bot.user.mentioned_in(message):

        # Remove the bot @ from the message content
        natural_language_query = message.clean_content.replace(f"@{bot.user.name}", "").strip().lower()

        # Send message that you're working on the query
        bot_response = await message.channel.send(f"Working on: ** {natural_language_query} **")

        # Call Text to SQL backend and update discord with the results
        response = await process_request(natural_language_query, bot_response, message.author.mention)

        if (response is None or response['status'] != 'success'):
            await message.channel.send("Sorry! Couldn't get an answer for that :(")
            return

        # Add emoji reactions to the message
        await bot_response.add_reaction("👍")
        await bot_response.add_reaction("👎")

        # Create a thread 
        thread = await bot_response.create_thread(name=natural_language_query, auto_archive_duration=60)

        # Reply with SQL query in the thread
        sql_query = format_sql_query(response)
        await thread.send(sql_query)

async def process_request(natural_language_query, bot_response, author): 
    start_time = time.time()

    url = "https://nba-gpt-prod.onrender.com/text_to_sql"
    payload = {
        "natural_language_query": natural_language_query,
        "scope": "sports",
        "stream": True
    }

    #streaming backend response
    for res in requests.post(url, json=payload, stream=True):
        for obj in decoder.decode(res.decode()):
            # each step in the stream
            current_time = time.time()
            time_taken =  "\nTime: "+ str(round(current_time - start_time, 2)) + " seconds"
            
            print('\n intermediate parsed json:', obj)
            print('\n status', obj['status'])
            await handle_response(obj, bot_response, natural_language_query, author, time_taken)
    
    final_response = obj

    return final_response

""" this function was written by GPT. don't ask me how it works. it makes the columns not overflow """
def adjust_column_width(ax, table, fig, df):
    num_rows = len(df.index) + 1
    num_cols = len(df.columns)

    # Split long column names into multiple lines
    wrapped_columns = [textwrap.fill(column, width=10) for column in df.columns]
    table.auto_set_column_width(False)

    for col_idx, column in enumerate(wrapped_columns):
        table[0, col_idx].set_text_props(text=column)

    # Get the renderer and calculate the text width in points
    renderer = fig.canvas.get_renderer()
    col_widths = [table[0, col_idx].get_window_extent(renderer).width for col_idx in range(num_cols)]

    # Normalize the column widths
    total_width = sum(col_widths)
    col_widths = [width / total_width for width in col_widths]

    # Set the column widths
    for row_idx in range(num_rows):
        for col_idx in range(num_cols):
            table[row_idx, col_idx].set_width(col_widths[col_idx])

def generate_table_image(result, nlq):
    df = pd.DataFrame(result["results"], columns=result['column_names'])

    # changes the column names from 'lebron_3pt_percentage'  -> 'lebron 3pt percentage' so that the text can wrap without overflowing
    df.columns = [' '.join(col.split('_')) for col in df.columns]

    # Create a table plot
    fig, ax = plt.subplots()
    ax.axis('off')
    ax.axis('tight')  # Remove extra whitespace
    table = ax.table(cellText=df.values, colLabels=df.columns, cellLoc='center', loc='center', bbox=[0, 0, 1, 1])

    # Add table title
    title_text = nlq
    ax.set_title(title_text, fontsize=16, fontweight='bold', pad=20)

    # Customize table appearance
    table.auto_set_font_size(False)
    table.set_fontsize(14)

    # Adjust column widths
    adjust_column_width(ax, table, fig, df)

    # Save the table plot to a buffer
    buf = io.BytesIO()
    plt.savefig(buf, format='png', bbox_inches='tight', dpi=300)  # Increase dpi for better quality
    buf.seek(0)

    # Send the table image as a file
    image_file = File(buf, filename='table.png')

    # Close the buffer and clear the plot
    buf.close()
    plt.clf()

    return image_file

async def handle_response(response_object, bot_response, nlq, author, time_taken):
    if (response_object['status'] == 'success'):
        table_image =  generate_table_image(response_object['response'], nlq)
        # Update discord with final results 
        success_message = format_success_message(nlq, author, time_taken)
        await bot_response.edit(content=success_message)
        await bot_response.channel.send(file=table_image)
        return
    
    if (response_object['state'].lower().startswith('error')):
        return

    # Update discord with intermediate step
    intermediate_message = format_intermidiate_message(response_object['state'], nlq, time_taken)
    await bot_response.edit(content=intermediate_message)
        
def get_success_data_as_table(result):
    data = result["results"]
    column_names = result["column_names"]

    table_data = [[d.get(col, "") for col in column_names] for d in data]
    table = tabulate(table_data, headers=column_names)

    return table

def format_success_message(natural_language_query, author_mention, time_taken):
    basketball_emoji = "🏀"

    return """\n**{nlq}** asked by {author}
Time: {time}

{emoji} Answer:
More Info:""".format(emoji=basketball_emoji, nlq=natural_language_query, time=time_taken, author=author_mention)

def format_intermidiate_message(state, natural_language_query, time_taken):
    return """**{nlq}**

{state}
{time}""".format(nlq=natural_language_query, state=state, time=time_taken)

def format_sql_query(result):
    sql_query = result["sql_query"]
    # ```sql\n adds SQL syntax highlighting
    return "\nCode: ```sql\n" + sql_query + "```"

bot.run(BOT_TOKEN)
