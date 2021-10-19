import React from 'react'
import { Link } from 'react-router-dom'

const Error = () => {
  return (
    <section className='error-page'>
      <div className="error-container">
        <h2>This is a dead end!!</h2>
        <Link to='/' className='btn btn-primary'>Go back</Link>
      </div>
 </section>
  )
}

export default Error
