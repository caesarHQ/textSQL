import {BsDiscord, BsGithub} from "react-icons/bs";

export const DiscordButton = () => {
     return <button
        type="button"
        className="inline-flex items-center gap-x-1.5 rounded-md bg-[#ebf0f4] py-1.5 px-2.5 text-sm font-semibold text-[#24292f] shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 "
        onClick={() => window.open('https://discord.gg/JZtxhZQQus','_blank')}
      >
         <BsDiscord />
        Discord
      </button>

}
// "https://github.com/caesarhq/textSQL"
export const GithubButton = () => {
         return <button
        type="button"
        className="inline-flex items-center gap-x-1.5 rounded-md bg-[#ebf0f4] py-1.5 px-2.5 text-sm font-semibold text-[#24292f] shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 "
        onClick={() => window.open('https://github.com/caesarhq/textSQL','_blank')}
      >
         <BsGithub />
        Github
      </button>
}