import React, { useEffect, useState } from 'react';

const CollectionList = () => {
  const [collections, setCollections] = useState([]);
  const [checkedCollections, setCheckedCollections] = useState({});

  useEffect(() => {
    // Fetch collection names from the backend API
    const fetchCollections = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_API_URL}/api/collections/getCollectionNames`);
        const data = await response.json();
        setCollections(data);
      } catch (error) {
        console.error('Failed to fetch collections:', error);
      }
    };
    fetchCollections();
  }, []);

  // Handle checkbox change
  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;
    setCheckedCollections((prev) => ({ ...prev, [name]: checked }));
  };

  return (
    <form>
      {collections.map((collection, index) => (
        <div key={index}>
          <input
            type="checkbox"
            id={`collection-${index}`}
            name={collection}
            checked={checkedCollections[collection] || false}
            onChange={handleCheckboxChange}
          />
          <label htmlFor={`collection-${index}`}>{collection}</label>
        </div>
      ))}
    </form>
  );
};

export default CollectionList;
