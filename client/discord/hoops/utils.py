import textwrap
import io
import pandas as pd
import matplotlib.pyplot as plt
from tabulate import tabulate
import discord

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

""" generates table image given results and adds a natural language query header"""
def generate_table_image(result, nlq):
    try:
        df = pd.DataFrame(result["results"], columns=result['column_names'])
        
        # Limit to 15 rows in the table image otherwise it looks ugly
        df = df.head(15)

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
        image_file = discord.File(buf, filename='table.png')

        # Close the buffer and clear the plot
        buf.close()
        plt.clf()

        return image_file

    except Exception as e:
        print(f"Error in Table Generation: {e}")

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

async def send_raw_data_as_csv(result, thread):
    df = pd.DataFrame(result["results"], columns=result['column_names'])

    #Limit to 99 rows otherwise discord will error out
    df = df.head(99)

    # Save the DataFrame as a CSV to a buffer
    buf = io.StringIO()
    df.to_csv(buf, index=False)
    buf.seek(0)

    # Convert the StringIO buffer to a binary buffer
    binary_buf = io.BytesIO(buf.getvalue().encode())

    # Create a File object
    csv_file = discord.File(binary_buf, filename='data.csv')

    # Send the CSV file as a Discord bot message
    await thread.send(content="Raw Data:", file=csv_file)
    return

def is_message_inside_thread(message):
    return isinstance(message.channel, discord.Thread)

def format_sql_query(result):
    sql_query = result["sql_query"]
    # ```sql\n adds SQL syntax highlighting
    return "\nCode: ```sql\n" + sql_query + "```"