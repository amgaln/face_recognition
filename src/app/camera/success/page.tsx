'use client'

import { useEffect, useState } from 'react';

export default function CameraSuccessPage() {
    const [confidence, setConfidence] = useState<string | null>(null);
    const [similarity, setSimilarity] = useState<string | null>(null);

    useEffect(() => {
        const storedConfidence = localStorage.getItem('faceConfidence');
        const storedSimilarity = localStorage.getItem('similarity');
        setSimilarity(storedSimilarity);
        localStorage.removeItem('similarity');
        localStorage.removeItem('liveFaceBase64');
        setConfidence(storedConfidence);
    }, []);

    return (
        <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50 px-4">
            <div className="max-w-md w-full space-y-6 text-center">
                <h1 className="text-3xl font-bold text-green-600">
                    Царай танилт амжилттай боллоо
                </h1>

                <div
                    className="w-48 h-48 mx-auto rounded-full border-4 border-green-600 bg-gray-100 flex items-center justify-center shadow-xl transition-transform duration-500 ease-out transform hover:scale-105"
                    style={{
                        borderRadius: '60% 60% 70% 70% / 55% 55% 80% 80%',
                    }}
                >
                    <span className="text-6xl text-green-400 animate-pulse">✅</span>
                </div>

                <p className="text-lg text-gray-600">
                    Царайг амжилттай танилаа. Та дараагийн алхам руу шилжиж байна.
                </p>

                <div className="text-lg text-gray-700">
                    {confidence ? (
                        <p>
                            Царай итгэл: <strong>{confidence}%</strong>
                        </p>
                    ) : (
                        <p className="text-sm text-gray-500">Итгэлцүүр олдсонгүй.</p>
                    )}
                </div>

                <button
                    type="button"
                    className="w-full py-3 px-4 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 focus:ring-4 focus:ring-gray-300 focus:outline-none transition duration-200 ease-in-out"
                    onClick={() => (window.location.href = '/camera')}
                    aria-label="Дахин царай танихыг оролдох"
                >
                    Дахин оролдох
                </button>

                <div className="flex flex-col items-center justify-center min-h-screen text-center space-y-4">
                    <h1 className="text-3xl font-bold text-green-600">Амжилттай!</h1>
                    {similarity ? (
                        <p className="text-xl text-gray-700">
                            Ижил төстэй байдал: <strong>{similarity}%</strong>
                        </p>
                    ) : (
                        <p className="text-red-500">Тооцоолол олдсонгүй.</p>
                    )}
                </div>
            </div>
        </div>
    );
}