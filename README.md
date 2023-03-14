# Natural Language → SQL

### 


Demo on US Census Data: [CensusGPT.com](https://censusgpt.com)


<h3 align="center">
  <a href="https://censusgpt.com/" target="_blank"> Website </a>&bull;
  <a href="https://t.co/FuOOcB6aGr"><b>Join the Discord Server</b></a>
</h3>

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
<p align="center">
   <a href='http://makeapullrequest.com'><img alt='PRs Welcome' src='https://img.shields.io/badge/PRs-welcome-43AF11.svg?style=shields'/></a>
   <a href="#contributors"><img src="https://img.shields.io/github/contributors/uselotus/lotus.svg?color=c0c8d0"></a>
   <a href="https://github.com/caesarHQ/textSQL/stargazers"><img src="https://img.shields.io/github/stars/caesarHQ/textSQL?color=e4b442" alt="Github Stars"></a>
   <a href="https://github.com/caesarHQ/textSQL/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-9d2235" alt="License"></a>
   <a href="https://github.com/caesarHQ/textSQL/commits/main"><img alt="GitHub commit activity" src="https://img.shields.io/github/commit-activity/m/caesarHQ/textSQL?color=8b55e3"/></a>
</p>


### How it works:
With CensusGPT, ask any questions related to census data. 

These natural language questions get converted to SQL using GPT-3.5 and are then used to query the census database.

Here are some examples:

* [🔍 Five cities with a population over 100,000 and lowest crime](https://censusgpt.com/?s=five%20cities%20with%20a%20population%20over%20100%2C000%20and%20lowest%20crime)
* [🔍 10 highest income areas in california](https://censusgpt.com/?s=10%20highest%20income%20areas%20in%20california)

<img width="1316" alt="Screenshot 2023-03-10 at 12 55 44 AM" src="https://user-images.githubusercontent.com/10172332/224270303-087495bd-2391-4e1f-a8ad-ef5ae49ace0c.png">


### Roadmap:

We're splitting the roadmap for this project broadly into three categories


#### Visualizations: 

Currently, textSQL only supports visualizing zipcodes and cities on the map using [Mapbox](https://mapbox.com). But data can be visualized in many other interesting ways like Bar Charts, Heatmaps and Pie charts. Not every kind of data can be (or should be) visualized on a map. For example, a query like _"What percent of total crime in San Francisco is burglary vs in New York City"_ is perfect for visualizing as a stacked bar chart, but really hard to visualize on map.

[coming soon] Heatmap: 

<img width="396" alt="Screenshot 2023-03-10 at 12 58 33 AM" src="https://user-images.githubusercontent.com/10172332/224271087-58cdcfd9-8940-4543-a3a5-1119477bd209.png">

[coming soon] Bar Chart:

<img width="400" alt="Screenshot 2023-03-10 at 1 00 03 AM" src="https://user-images.githubusercontent.com/10172332/224271492-a8f71f0b-4ee3-4531-9117-900b4b758d73.png">



#### Datasets: 

A lot of the users of this project have asked for historical census data (trends), weather, health, transportation and real-estate data. Feel free to create a pull request, drop a link to your dataset in our [Discord](https://discord.gg/JZtxhZQQus), or contribute data via our [dedicated submission form](https://airtable.com/shrDKRRGyRCihWEZd).

More data → Better CensusGPT

#### Query Interface:

Users build complex queries progressively. They start with a simple query like _"Which neighborhoods in LA have the best schools?"_ and then progressively add details like _"with median income that is under $100,000"_. One of the most powerful things that GPT-3.5 turbo enables is iterating on a query.

Turning search into a chat interface will allow the users to do just that -- iterate on a query and progressively build it.

#### How to Contribute:

Join our [discord](https://discord.gg/JZtxhZQQus)

ReadMe for the backend [here](https://github.com/caesarHQ/textSQL/blob/main/api/README.md)

ReadMe for the frontend [here](https://github.com/caesarHQ/textSQL/blob/main/client/README.md)

<a href="https://github.com/caesarHQ/textSQL/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=caesarHQ/textSQL" />
</a>  

### 

**Note:** Census data, like any other dataset, has its limitations and potential biases. Some data may not be collected or reported uniformly across different regions or time periods, which can affect the comparability of results. Users should keep these limitations in mind when interpreting the results of their queries and exercise caution when making decisions based on census data.
