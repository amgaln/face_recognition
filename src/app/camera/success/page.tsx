'use client';

export default function SuccessPage() {
    return (
        <div className="flex flex-col justify-center items-center h-screen bg-green-50">
            <div className="bg-white p-8 rounded-xl shadow-lg flex flex-col items-center">
                <svg
                    className="w-20 h-20 text-green-500 mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="white" />
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12l2 2 4-4"
                    />
                </svg>
                <h2 className="text-2xl font-bold mb-2 text-green-700">Таны царай амжилттай танигдлаа!</h2>
                <p className="text-gray-600 text-center">
                    Баяр хүргэе. Та амжилттай нэвтэрлээ.
                </p>
            </div>
        </div>
    );
}