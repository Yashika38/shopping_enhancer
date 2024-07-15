import React from 'react';

function Card(props) {
    const { card } = props;

    return (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <img src={card.img} alt="img" className="py-[900px] w-full h-48 object-cover" />
            <div className="p-4 border-10">
                <h2 className="text-lg font-semibold">{card.company}</h2>
                <p className="text-gray-600">{card.name}</p>
                <p className="text-gray-800 font-bold">Rs.{card.price}</p>
            </div>
        </div>
    );
}

export default Card;
