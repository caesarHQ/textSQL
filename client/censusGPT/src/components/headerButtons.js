import { useState } from 'react'
import {
    BsArrowUp,
    BsDiscord,
    BsGithub,
    BsMoonFill,
    BsSunFill,
    BsUpload,
} from 'react-icons/bs'

const HeaderButton = ({ title, icon, onClick }) => (
    <button
        type="button"
        className="inline-flex items-center gap-x-1.5 rounded-md bg-[#ebf0f4] dark:bg-dark-800 py-1.5 px-2.5 text-sm font-semibold text-[#24292f] dark:text-neutral-200 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 "
        onClick={onClick}
    >
        {icon}
        {title && <span className="hidden md:block">{title}</span>}
    </button>
)

export const DiscordButton = () => (
    <HeaderButton
        title="Discord"
        icon={<BsDiscord />}
        onClick={() => window.open('https://discord.gg/JZtxhZQQus', '_blank')}
    />
)

// "https://github.com/caesarhq/textSQL"
export const GithubButton = () => (
    <HeaderButton
        title="Star on GitHub"
        icon={<BsGithub />}
        onClick={() =>
            window.open('https://github.com/caesarhq/textSQL', '_blank')
        }
    />
)

export const ContributeButton = () => (
    <HeaderButton
        title="Contribute Data"
        icon={<BsUpload />}
        onClick={() =>
            window.open('https://airtable.com/shrDKRRGyRCihWEZd', '_blank')
        }
    />
)

export const DarkModeButton = () => {
    const [darkMode, setDarkMode] = useState(
        document.documentElement.classList.contains('dark')
    )
    return (
        <HeaderButton
            icon={darkMode ? <BsSunFill /> : <BsMoonFill />}
            onClick={() => {
                if (darkMode) {
                    document.documentElement.classList.remove('dark')
                    setDarkMode(false)
                } else {
                    document.documentElement.classList.add('dark')
                    setDarkMode(true)
                }
            }}
        />
    )
}
