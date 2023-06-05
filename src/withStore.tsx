import React from 'react';

export const withStore = (stores: any) => {

  return (Component: any) => {

    const StoreComponent = React.forwardRef((props: any, ref: any) => {

      const states: any = {};
      for (let key in stores) {
        states[key] = stores[key]();
      }

      if (ref) {
        return <Component {...states} {...props} ref={ref} />;
      }

      return <Component {...states} {...props} />;
    });

    return StoreComponent;
  };
};