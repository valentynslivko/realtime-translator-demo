import { Link } from "react-router-dom"
import '../index.css'
export default function Home() {
    return <div className="flex align-middle justify-center">
        <ul className="list-none no-underline space-y-4 text-black">
            <li className="mt-10 text-black">
                <Link to="/mic" className="no-underline text-black decoration-black border border-green-300 rounded-xl p-2 bg-green-300 text-gray-500 hover:bg-amber-400 hover:border-amber-400">Record your own audio</Link>
            </li>
            <li>
                <Link to="/audio" className="no-underline text-black decoration-black">Translate from pre-recorded audio</Link>
            </li>
        </ul>
    </div>
}