// src/app/camera/input/page.tsx
'use client';

import { useState } from 'react';
import { CameraIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CameraInputPage() {
    const [preview, setPreview] = useState<string | null>(null);
    const [targetBase64Image, setBase64Image] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setPreview(result);
                setBase64Image(result.split(',')[1]);
                console.log('Image selected, base64 length:', result.length);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async () => {
        if (!targetBase64Image) {
            alert('Зураг оруулаагүй байна.');
            return;
        }

        const sourceImage = localStorage.getItem('sourceImage');
        if (!sourceImage) {
            alert('Амьд зураг бүртгэгдээгүй байна. Эхлээд царай таних хуудас руу орно уу.');
            return;
        }

        setLoading(true);

        try {
            console.log('Sending request to /api/compare-faces', {
                sourceImageLength: sourceImage.length,
                targetImageLength: targetBase64Image.length,
            });
            const res = await fetch('/api/compare-faces', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sourceImage,
                    targetImage: targetBase64Image,
                }),
            });

            const text = await res.text(); // Get raw response to debug
            console.log('Raw response:', text);

            let data;
            try {
                data = JSON.parse(text);
            } catch (err) {
                console.error('Failed to parse JSON:', err);
                throw new Error('Invalid response format from server');
            }

            if (!res.ok) {
                console.error('API error:', data);
                throw new Error(data.message || 'Алдаа гарлаа.');
            }

            console.log('API response:', data);
            const similarity = data.FaceMatches[0]?.Similarity || 0;
            localStorage.setItem('similarity', similarity.toFixed(2));
            router.push('/camera/success');
        } catch (err: any) {
            console.error('Submit error:', err);
            alert(err.message || 'Сервертэй холбогдож чадсангүй.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
            <div className="bg-white shadow-2xl rounded-2xl p-8 max-w-md w-full text-center">
                <h1 className="text-2xl font-bold text-gray-800 mb-4">Зураг оруулах</h1>
                <p className="text-sm text-gray-500 mb-6">Баталгаажуулалт хийх зургаа оруулна уу.</p>

                <label
                    htmlFor="kyc-image-input"
                    className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-6 cursor-pointer hover:bg-gray-50 transition"
                >
                    {preview ? (
                        <img
                            src={preview}
                            alt="Preview"
                            className="w-40 h-40 object-cover rounded-full mb-2"
                        />
                    ) : (
                        <>
                            <CameraIcon className="w-12 h-12 text-gray-400 mb-2" />
                            <span className="text-gray-600">Энд дарж зургаа оруулна уу.</span>
                        </>
                    )}
                </label>
                <input
                    type="file"
                    id="kyc-image-input"
                    accept="image/*"
                    capture="user"
                    onChange={handleImageChange}
                    className="hidden"
                />

                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="mt-6 w-full bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 transition"
                >
                    {loading ? 'Илгээж байна...' : 'Зураг илгээх'}
                </button>
            </div>
        </div>
    );
}