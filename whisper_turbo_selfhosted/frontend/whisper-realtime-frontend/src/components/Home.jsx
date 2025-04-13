import { Link } from "react-router-dom"
import '../index.css'
export default function Home() {
    return <div className="flex align-middle justify-center">
        <ul className="list-none no-underline space-y-4 text-black">
            <li className="mt-10">
                <Link to="/mic" className="no-underline text-black decoration-black">Record your own audio</Link>
            </li>
            <li>
                <Link to="/audio" className="no-underline text-black decoration-black">Translate from pre-recorded audio</Link>
            </li>
            <li>
                <Link to="/prerecorded" className="no-underline text-black decoration-black">Translate from pre-recorded audio stream</Link>
            </li>
        </ul>
    </div>
}