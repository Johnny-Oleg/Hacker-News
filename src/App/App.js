import React, { Component } from 'react';
import axios from 'axios'; 

import Search from '../Search/Search';
import Table from '../Table/Table';
import Button from '../Button/Button';

import './App.css';

const DEFAULT_QUERY = 'redux';
const DEFAULT_HPP = '100';

const PATH_BASE = 'https://hn.algolia.com/api/v1'; 
const PATH_SEARCH = '/search';
const PARAM_SEARCH = 'query=';
const PARAM_PAGE = 'page=';
const PARAM_HPP = 'hitsPerPage=';

const updateSearchTopStoriesState = (hits, page) => prevState => {
  const { searchKey, results } = prevState;
  const oldHits = results && results[searchKey] ? results[searchKey].hits : [];
  const updatedHits = [ ...oldHits,...hits];

  return {
    results: {...results, [searchKey]: { hits: updatedHits, page }},
    isLoading: false
  };
};

class App extends Component {
  _isMounted = false;

  state = { 
      results: null,
      searchKey: '',
      searchTerm: DEFAULT_QUERY,
      error: null,
      isLoading: false,
  }

  needsToSearchTopStories = searchTerm => !this.state.results[searchTerm];

  setSearchTopStories = result => {
    const { hits, page } = result;
    
    this.setState(updateSearchTopStoriesState(hits, page));
  }

  fetchSearchTopStories = (searchTerm, page = 0) => { 
    this.setState({ isLoading: true });
  
    axios(`${PATH_BASE}${PATH_SEARCH}?${PARAM_SEARCH}${searchTerm}&${PARAM_PAGE}${page}&${PARAM_HPP}${DEFAULT_HPP}
    `)      
      .then(result => this._isMounted && this.setSearchTopStories(result.data))
      .catch(error => this._isMounted && this.setState({ error }));  
  }

  componentDidMount = () => {
    this._isMounted = true;
    
    const { searchTerm } = this.state;
    this.setState({ searchKey: searchTerm });
    
    this.fetchSearchTopStories(searchTerm);
  }

  componentWillUnmount = () => { 
    this._isMounted = false;
  }

  onSearchChange = e => {
    this.setState({ searchTerm: e.target.value });
  }

  onSearchSubmit = e => {
    const { searchTerm } = this.state;
    this.setState({ searchKey: searchTerm });

    if (this.needsToSearchTopStories(searchTerm)) {
      this.fetchSearchTopStories(searchTerm);
    }

    e.preventDefault();
  }

  onDismiss = id => {
    const { searchKey, results } = this.state; 
    const { hits, page } = results[searchKey];

    const isNotId = item => item.objectID !== id;
    const updatedHits = hits.filter(isNotId);

    this.setState({ results: { ...results, [searchKey]: { hits: updatedHits, page } }});
  }

  render() {
    const { searchTerm, results, searchKey, error, isLoading } = this.state;
    const page = (results && results[searchKey] && results[searchKey].page) || 0;
    const list = (results && results[searchKey] && results[searchKey].hits) || [];
    
    if (error) {
      return <p>Something went wrong.</p>;
    }

    return (
      <div className="page">
        <div className="interactions">
          <Search 
            value={searchTerm} 
            onChange={this.onSearchChange}
            onSubmit={this.onSearchSubmit}
          > 
            Search
          </Search>
        </div>    
        { error
          ? <div className="interactions">
              <p>Something went wrong.</p> 
            </div>
          : <Table 
              list={list} 
              onDismiss={this.onDismiss}
            /> 
        }
        <div className="interactions">
          <ButtonWithLoading  
            isLoading={isLoading}
            onClick={() => this.fetchSearchTopStories(searchKey, page + 1)} 
          >
            More stories
          </ButtonWithLoading>
        </div>
      </div> 
    );  
  } 
}

const Loading = () => <div>Loading ...</div>

const withLoading = Component => ({ isLoading, ...rest }) => 
  isLoading ? <Loading /> : <Component { ...rest } />;

const ButtonWithLoading = withLoading(Button);

export default App;