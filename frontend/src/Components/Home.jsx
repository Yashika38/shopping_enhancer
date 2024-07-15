import React from 'react';
import Card from './Card';
import top from '../assets/top.png';

function Home() {
    const examplecard = [
        {
            id: 1,
            img: top,
            company: "Nike",
            name: "shoes",
            price: "2000"
        },
        {
            id: 2,
            img: top,
            company: "Nike",
            name: "shoes",
            price: "2000"
        },
        {
            id: 3,
            img: top,
            company: "Nike",
            name: "shoes",
            price: "2000"
        },
        {
            id: 4,
            img: top,
            company: "Nike",
            name: "shoes",
            price: "2000"
        },
    ];

    return (
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {examplecard.map((el) => (
                <Card key={el.id} card={el} />
            ))}
        </div>
    );
}

export default Home;
