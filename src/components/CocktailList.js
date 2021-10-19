import React from 'react'
import Cocktail from './Cocktail'
import Loading from './Loading'
import { Link } from 'react-router-dom'
import { useGlobalContext } from '../context'

const CocktailList = () => {
  const {cocktails,loading ,setSearchterm } = useGlobalContext();

  const rerender = () => {
    setSearchterm('a');
  }
  // if (loading) {
  //   return <Loading/>
  // }
  if (cocktails.length < 1) {
    return ( <h2 className='section-title'>
      no cocktails matched your search criteria,change your search!!
       <Link to='/' className='btn btn-primary' onClick={()=>rerender()}>
          back home
        </Link>
    </h2 >
    )
  }
  return (
    <section className='section'>
      <h2 className="section-title">
        Cocktails
      </h2>
      <div className="cocktails-center">
        {cocktails.map((cocktail) => {
          return (
             <Cocktail key={cocktail.id} {...cocktail}  />
          )
        })}
      </div>
    </section>
  )
}

export default CocktailList
