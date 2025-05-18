import { Link } from "react-router-dom"
import '../index.css'
export default function Home() {
    return <div className="flex align-middle justify-center">
        <ul className="list-none no-underline space-y-8 text-black flex flex-col align-middle items-center">
            <li className="mt-10 text-black">
                <Link to="/mic" className="no-underline text-black decoration-black border border-green-300 rounded-xl p-2 bg-green-300 text-gray-800 hover:bg-amber-400 hover:border-amber-400">Record your own audio</Link>
            </li>
            <li>
                <Link to="/prerecorded" className="no-underline text-white decoration-black border border-purple-400 bg-purple-400 rounded-xl p-2 hover:bg-blue-500 hover:text-gray-800">Translate from pre-recorded audio</Link>
            </li>
        </ul>
    </div>
}