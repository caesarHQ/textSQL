import { XMarkIcon } from '@heroicons/react/20/solid';

export default function PromoBanner() {
    return (
        <div className="flex items-center gap-x-6 bg-white px-6 py-10 sm:px-3.5 sm:before:flex-1">
            <p className="text-xl leading-6 text-black">
                <strong>Hey!</strong> The team behind CensusGPT is now working on Julius, your personal AI data analyst&nbsp;
            </p>
            <a
                href="https://julius.ai?utm_source=censusGPT"
                className="flex-none rounded-full bg-red-500 px-3.5 py-1 text-lg font-semibold text-white shadow-sm hover:bg-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
            >
                Check out Julius <span aria-hidden="true">&rarr;</span>
            </a>
            <div className="flex flex-1 justify-end">
                <button type="button" className="-m-3 p-3 focus-visible:outline-offset-[-4px]">
                    <span className="sr-only">Dismiss</span>
                    <XMarkIcon className="h-5 w-5 text-gray-900" aria-hidden="true" />
                </button>
            </div>
        </div>
    );
}
