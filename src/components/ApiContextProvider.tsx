import React, { createContext, ReactNode, useContext, useReducer } from "react";

interface IApiContextRequestType {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  model?: string;
  url: string;
  body?: any;
}

interface IApiType {
  [key: string]: any;
  fetchRequest: (params: IApiContextRequestType) => Promise<any>;
}

const ACTION = { REQ: "REQ", RES: "RES", ERR: "ERR" };

const dataReducer = (state: any, action: any) => {
  switch (action?.type) {
    case ACTION.REQ:
      return { ...state, [`is${action.model}`]: true };

    case ACTION.RES:
      return {
        ...state,
        [`is${action.model}`]: false,
        [`res${action.model}`]: action?.data || null,
      };

    case ACTION.ERR:
        return {
          ...state,
          [`is${action.model}`]: false,
          [`res${action.model}`]: null,
          [`err${action.model}`]: action?.data,
        };
    default:
      return state;
  }
};

export const ApiContext = createContext<IApiType | undefined>(undefined);

interface ApiProviderProps {
  children: ReactNode;
}

const initinalState = {};

export const ApiProvider: React.FC<ApiProviderProps> = ({ children }) => {
  const [state, dispatch]: any = useReducer(dataReducer, initinalState);

  const fetchRequest = async ({
    url,
    body,
    model,
    method = "GET",
  }: IApiContextRequestType): Promise<any> => {
    const modelKey = model || url;

    try {
      // Dispatching the request action
      dispatch({ model: modelKey, type: ACTION.REQ });

      // Fetch request configuration for formData and JSON data
      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }).catch((err) => err);

      // Handle other non-success responses
      if (response?.status !== 200 || !response?.ok) {
        const json = await response.json();
        dispatch({ model: modelKey, data: response, type: ACTION.ERR });
        return json;
      }

      // Handle successful response
      const json = await response.json();
      dispatch({ model: modelKey, data: json?.data, type: ACTION.RES });

      return json;
    } catch (error) {
      dispatch({ model: modelKey, data: error, type: ACTION.ERR });
      throw error;
    }
  };

  return (
    <ApiContext.Provider
      value={{ ...state, fetchRequest }}
      children={children}
    />
  );
};

export const useApi = () => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error("useApi must be used within an ApiProvider");
  }
  return context;
};
