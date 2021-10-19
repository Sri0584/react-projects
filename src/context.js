import React, { useState, useContext, useEffect } from 'react'
import { useCallback } from 'react'

const url = 'https://www.thecocktaildb.com/api/json/v1/1/search.php?s='
const AppContext = React.createContext()

const AppProvider = ({ children }) => {
  const [cocktails, setCocktails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchterm, setSearchterm] = useState('a');

  const fetchData = useCallback(async () => {
    console.log('usecallback');
    setLoading(true);
    try {
      const response = await fetch(`${url}${searchterm}`);
      const data = await response.json();
      const { drinks } = data;
      if (drinks) {
        const newDrinks = drinks.map((drink) => {
          const { idDrink,
            strDrinkThumb,
            strGlass,
            strAlcoholic,
            strDrink } = drink;
          return {
            id: idDrink,
            name: strDrink,
            image: strDrinkThumb,
            glass: strGlass,
            info: strAlcoholic
          }
        });
        console.log(newDrinks);
        setCocktails(newDrinks)
      } else {
        setCocktails([]);
      }
    } catch (error) {
      setLoading(false)
      throw new Error(error);
    }
  }, [searchterm]);

  useEffect(() => {
    console.log('useeffect');
    fetchData();
  }, [searchterm,fetchData]);

  return (
  <AppContext.Provider
      value={{
        loading,
        cocktails,
        searchterm,
        setSearchterm,
      }}>
    {children}
    </AppContext.Provider>
  )
}

export const useGlobalContext = () => {
  return useContext(AppContext)
}

export { AppContext, AppProvider }
