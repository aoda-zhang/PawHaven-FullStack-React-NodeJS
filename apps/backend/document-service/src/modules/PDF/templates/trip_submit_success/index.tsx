import * as React from 'react';
import './index.css';

interface Props {
  title: string;
  content: Array<{ name: string; value: string }>;
}
export const TripSubmitSuccess: React.FC<Props> = ({ title, content }) => {
  return (
    <>
      <div>{title}</div>
      {content?.map((item, index) => (
        <div key={index}>
          <span>{item?.name}</span>
          <span>{item.value}</span>
        </div>
      ))}
    </>
  );
};
