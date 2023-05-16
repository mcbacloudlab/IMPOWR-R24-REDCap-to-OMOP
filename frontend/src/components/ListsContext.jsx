import React, { createContext, useState, useContext } from 'react';

const ListsContext = createContext();

export const useLists = () => {
  return useContext(ListsContext);
};

export const ListsProvider = ({ children }) => {
  const [pendingList, setPendingList] = useState([]);
  const [failedList, setFailedList] = useState([]);
  const [completedList, setCompletedList] = useState([]);
  const [allCompletedList, setAllCompletedList] = useState([]);
  const [allPendingList, setAllPendingList] = useState([]);
  const [allFailedList, setAllFailedList] = useState([]);

  const value = {
    pendingList,
    failedList,
    completedList,
    setPendingList,
    setFailedList,
    setCompletedList,
    allCompletedList,
    allPendingList,
    allFailedList,
    setAllCompletedList,
    setAllPendingList,
    setAllFailedList
  };

  return (
    <ListsContext.Provider value={value}>
      {children}
    </ListsContext.Provider>
  );
};
