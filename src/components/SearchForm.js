import React, { useEffect } from 'react'
import { useGlobalContext } from '../context'

const SearchForm = () => {
  const { setSearchterm } = useGlobalContext();
  const searchValue = React.useRef(null);

console.log(searchValue);
  const handleSearch = () => {
    setSearchterm(searchValue.current.value);
  }
  const handleSubmit = (e) => {
    e.preventDefault();
  }
  useEffect(() => {
    searchValue.current.focus()
  }, []);

  return (
    <div className='section search'>
      <form className="search-form " onSubmit={handleSubmit}>
        <div className="form-control">
        <label htmlFor='search'>Search your Favourite Cocktail</label>
        <input
          type='text'
          name='search'
          ref={searchValue}
          onChange={handleSearch}
        ></input>

        </div>
      </form>
    </div>
  )
}

export default SearchForm
