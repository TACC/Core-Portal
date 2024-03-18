import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

const useAddonComponents = ({ portalName }) => {
  const [addonComponents, setAddonComponents] = useState({});
  const addons = useSelector((state) => state.workbench.config.addons);
  useEffect(() => {
    const loadAddonComponents = async () => {
      try {
        for (const addonName of addons) {
          const module = await import(
            `../../components/_custom/${portalName}/${addonName}/${addonName}.jsx`
          );
          setAddonComponents(prevComponents => ({
            ...prevComponents,
            [addonName]: module.default 
          }));
        }
      } catch (error) {
        console.error('Error loading addon components:', error);
      }
    };

    if (addons) {
      loadAddonComponents();
    }
  }, []);
  return addonComponents;
}

export default useAddonComponents;
