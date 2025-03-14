import React, { useEffect, useState } from 'react';
import Search from './components/Search';
import Spinner from './components/Spinner';
import MovieCard from './components/MovieCard';
import { useDebounce } from 'react-use';
import { updateSearchCount,getTrendingMovies } from './appwrite.js';

const API_BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const API_OPTIONS = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${API_KEY}`
  }
};

const App = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMessage,setErrorMessage] = useState(null);
  const [movieList, setMovieList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [debounceSearchTerm, setDebounceSearchTerm] = useState('')
  const [trendingMovies, setTrendingMovies] = useState([])
  
  useDebounce(
    () => {
      setDebounceSearchTerm(searchTerm)
    },
    1000, // Delay 500 ms
    [searchTerm] // Dependencies
  )

  const fetchMovies = async (query = '')=>{
    setIsLoading(true);
    setErrorMessage(null);
    try{
      const endpoint = query ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}` :`${API_BASE_URL}/discover/movie?sort_by=popularity.desc`
      const response = await fetch(endpoint,API_OPTIONS);
      if (!response.ok) {
        throw new Error(`Failed to fetch movies. Status: ${response.status}`);
      }
      const data = await response.json();
      if(data.response === 'false'){
        setErrorMessage(data.error || 'Failed to fecth movies');
        setMovieList([]);
        return;
      }
      setMovieList(data.results || []);
      
      if (query && data.results?.length > 0) {
        try {
          await updateSearchCount(query, data.results[0]);
        } catch (appwriteError) {
          console.error("Failed to update search count:", appwriteError);
        }
      }
    }
    catch(error){
      console.error(`Error fetching movies: ${error}`);
      setErrorMessage('Error fetching movies please try again later.');
    }
    finally{
      setIsLoading(false);
    }


  }

  const loadTrendingMovies = async () => {
    try {
      const movies = await getTrendingMovies();
      setTrendingMovies(movies);

    } catch (error) {
      console.log(error);
      
    }
  }

  useEffect(()=>{
    fetchMovies(debounceSearchTerm);
  },[debounceSearchTerm])
  useEffect(() => {
    loadTrendingMovies();
  },[])

  return (
    <main>
      <div className='pattern'/>
      <div className='wrapper'>
        <header>
          <img src="./hero.png" alt="Hero Banner" />
          <h1>
            Find <span className='text-gradient'>Movies</span> You'll Enjoy Without the Hassle
          </h1>
          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </header>
        {
          trendingMovies.length > 0 && (
            <section className='trending'>
              <h2>Trending Movies</h2>
              <ul>
                {trendingMovies.map((movie, index) => (
                <li key={movie.$id}>
                  <p>{index + 1 }</p>
                  <img src={movie.poster_url} alt={movie.title} />
                </li>
                ))}
              </ul>
            </section>
          )
        }
        <section className='all-movies'>
          <h2 className='mt-[40px]'>Popular Movies</h2>
          {isLoading ? (  
          <Spinner/>
          ) : errorMessage ? (
          <p className='text-red-500'>{errorMessage}</p>
          ) : (<ul>
            {movieList.map((movie)=>(
            <MovieCard key={movie.id} movie={movie}/>
            ))}
          </ul>) }
      </section>
      </div>
    </main>
  )
}

export default App
