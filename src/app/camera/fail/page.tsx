'use client'

export default function CameraFailPage() {
    return (
        <div className="flex flex-col justify-center items-center h-screen relative space-y-6">
            <h2 className="text-center w-full mb-4 font-bold text-red-600">Царай танихад амжилтгүй боллоо</h2>
            <ul className="w-full max-w-md space-y-4">
                <li className="flex justify-center items-center">
                    <div className="w-72 h-96 rounded-full border-4 border-red-600 bg-gray-100 flex items-center justify-center shadow-lg"
                        style={{
                            borderRadius: '60% 60% 70% 70% / 55% 55% 80% 80%',
                        }}
                    >
                        <span className="text-6xl text-red-400">😞</span>
                    </div>
                </li>
                <li className="text-center w-full mb-4 text-gray-500">
                    Царайг таньж чадсангүй. Дахин оролдоно уу.
                </li>
                <li>
                    <button
                        type="button"
                        className="w-full py-2 px-4 bg-black text-white rounded-lg font-semibold hover:bg-gray-700 transition"
                        onClick={() => window.location.href = '/camera'}
                    >
                        Дахин оролдох
                    </button>
                </li>
            </ul>
        </div>
    );
}