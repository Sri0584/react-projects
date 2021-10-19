import React from 'react'
import { Link } from 'react-router-dom'

const Cocktail = ({ id, name, image, glass, info }) => {
  
  return (
    <section className='cocktail'>
        <img src={image} alt='drink' />
        <div className="cocktail-footer">
        <h3>{name}</h3>
        <h4>{glass}</h4>
        <p>{info}</p>
        <Link to={`/cocktail/${id}`} className='btn btn-primary btn-details'>
          Details
        </Link>
        </div>
      </section>
  )
}

export default Cocktail
