// src/app/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
    const router = useRouter();

    useEffect(() => {
        // Нүүр хуудсанд хандахад шууд Login руу шилжүүлнэ
        router.push('/login');
    }, []);

    return null;
}
