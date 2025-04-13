import { useState, useEffect } from 'react';
import { collection, query, getDocs, QueryConstraint } from 'firebase/firestore';
import { db } from '../services/firebase';

export function useFirestore<T>(
  collectionName: string,
  constraints: QueryConstraint[] = []
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        console.log(`Fetching ${collectionName} collection...`);
        const q = query(collection(db, collectionName), ...constraints);
        
        console.log(`Executing query for ${collectionName}...`);
        const snapshot = await getDocs(q);
        
        console.log(`Got ${snapshot.docs.length} documents from ${collectionName}`);
        
        if (!isMounted) return;

        const items = snapshot.docs.map(doc => {
          const data = doc.data();
          console.log(`Document ${doc.id} data:`, data);
          return {
            id: doc.id,
            ...data
          };
        }) as T[];

        console.log(`Processed ${items.length} items from ${collectionName}`);
        setData(items);
        setError(null);
      } catch (err) {
        console.error(`Error fetching ${collectionName}:`, err);
        if (!isMounted) return;
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setData([]); // Reset data on error
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [collectionName, JSON.stringify(constraints)]);

  return { data, loading, error };
} 