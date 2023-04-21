import { useState, useRef, useEffect } from 'react'
import { hybrid } from 'react-syntax-highlighter/dist/esm/styles/hljs'
import SyntaxHighlighter from 'react-syntax-highlighter'
import { ImSpinner } from 'react-icons/im'

import {
    BsClipboard2,
    BsClipboard2Check,
    BsPatchQuestion,
    BsPencilSquare,
} from 'react-icons/bs'

export const SQLDisplay = ({
    sql,
    setSqlExplanationIsOpen,
    sqlExplanationIsOpen,
    isExplainSqlLoading,
    sqlExplanation,
    explainSql,
    executeSql,
    setSQL,
    title,
}) => {
    const [copied, setCopied] = useState(false)
    const [editingSql, setEditingSql] = useState(false)

    const sqlRef = useRef(sql)
    const sqlExplanationRef = useRef(null)

    const CopySqlToClipboardButton = ({ text }) => {
        const handleCopy = async () => {
            if ('clipboard' in navigator) {
                setCopied(true)
                setTimeout(() => setCopied(false), 1000)
                return await navigator.clipboard.writeText(text)
            } else {
                setCopied(true)
                setTimeout(() => setCopied(false), 1000)
                return document.execCommand('copy', true, text)
            }
        }

        return (
            <button
                onClick={handleCopy}
                className="text-xs rounded-md px-2.5 py-2 font-semibold text-gray-900 dark:text-neutral-200 ring-1 ring-inset ring-gray-300 dark:ring-dark-300 bg-white dark:bg-neutral-600 hover:bg-gray-100 dark:hover:bg-neutral-700"
            >
                {copied ? <BsClipboard2Check /> : <BsClipboard2 />}
            </button>
        )
    }

    const EditSqlButton = () => (
        <button
            onClick={() => setEditingSql(!editingSql)}
            className={`text-xs rounded-md px-2.5 py-2 font-semibold text-gray-900 dark:text-neutral-200 ring-1 ring-inset ring-gray-300 dark:ring-dark-300 hover:bg-gray-100 dark:hover:bg-neutral-700  ${
                editingSql
                    ? 'bg-gray-100 dark:bg-neutral-700'
                    : 'bg-white dark:bg-neutral-600'
            }`}
        >
            <BsPencilSquare />
        </button>
    )

    const ExplainSqlButton = () => (
        <>
            <div className="group relative flex">
                <button
                    onClick={() => {
                        setSqlExplanationIsOpen(!sqlExplanationIsOpen)
                        !sqlExplanation && explainSql(sqlRef.current)
                    }}
                    className={`text-lg hover:text-blue-600 ${
                        sqlExplanationIsOpen && 'text-blue-600'
                    }`}
                >
                    <BsPatchQuestion />
                </button>
                {sqlExplanationIsOpen ? (
                    <div
                        ref={sqlExplanationRef}
                        className="h-[5.4rem] w-[28.5rem] flex overflow-auto top-7 text-xs absolute rounded-md p-2 bg-gray-300/95 dark:bg-dark-800/95 backdrop-blur-xl ring-blue-600 ring-1 ring-inset"
                    >
                        {isExplainSqlLoading ? (
                            <div className="flex w-full items-center justify-center text-lg">
                                <ImSpinner className="animate-spin" />
                            </div>
                        ) : (
                            <span className="whitespace-pre-wrap text-sm font-medium">
                                {sqlExplanation}
                            </span>
                        )}
                    </div>
                ) : (
                    <div className="font-semibold top-7 text-sm hidden group-hover:block absolute rounded-md p-1 bg-gray-300/75 dark:bg-dark-800/75 backdrop-blur ring-gray-900 dark:ring-gray-300 ring-1">
                        Click to explain SQL
                    </div>
                )}
            </div>
        </>
    )
    //when there's a click outside of the sql explanation, close it
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                sqlExplanationRef?.current &&
                !sqlExplanationRef?.current?.contains(event.target)
            ) {
                setSqlExplanationIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [sqlExplanationRef, setSqlExplanationIsOpen])

    return (
        <pre
            align="left"
            className="rounded-lg bg-gray-100 dark:bg-dark-800 dark:text-white ring-dark-300 ring-0"
        >
            <div className="flex items-center w-full min-h-full">
                <div className="rounded-t-lg flex w-full justify-end h-full items-center p-2 space-x-1.5 bg-gradient-to-b dark:from-black/50 from-neutral-300/75 to-neutral-300/50 dark:to-black/20 backdrop-blur-sm font-sans">
                    <ExplainSqlButton />
                    <h2 className="font-bold tracking-wide h-6 overflow-hidden flex w-full">
                        {title}
                    </h2>
                    <div className="flex right-1 space-x-1.5 relative items-center">
                        {editingSql && (
                            <button
                                onClick={() => {
                                    setSQL(sqlRef.current)
                                    setEditingSql(false)
                                    executeSql(sqlRef.current)
                                }}
                                className="h-6 text-xs items-center flex rounded-full ring-1 ring-blue-600 bg-blue-600/50 hover:bg-blue-600/75 px-2 backdrop-blur-lg font-semibold text-white"
                            >
                                Submit
                            </button>
                        )}
                        {/* <EditSqlButton /> */}
                        <CopySqlToClipboardButton text={sqlRef.current} />
                    </div>
                </div>
            </div>
            <code
                className={`px-2 bg-transparent text-sm text-gray-800 dark:text-white flex ${
                    editingSql && 'ring-2 ring-inset'
                }`}
            >
                <SyntaxHighlighter
                    language="sql"
                    style={hybrid}
                    customStyle={{
                        color: undefined,
                        background: undefined,
                        margin: undefined,
                        padding: undefined,
                    }}
                    contentEditable={editingSql}
                    spellCheck={false}
                    suppressContentEditableWarning
                    onInput={(e) =>
                        (sqlRef.current = e.currentTarget.textContent)
                    }
                    className="outline-none"
                    onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey && editingSql) {
                            setSQL(sqlRef.current)
                            setEditingSql(false)
                            executeSql(sqlRef.current)
                        }
                    }}
                    // onDoubleClickCapture={() => !editingSql && setEditingSql(true)}
                >
                    {editingSql ? sqlRef.current : sql}
                </SyntaxHighlighter>
            </code>
        </pre>
    )
}
