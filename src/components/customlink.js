const IS_EXTERNAL_LINK_REGEX = /^(?:[a-z][a-z\d+.-]*:|\/\/)/;

const CustomLinkComponent = ({children, url, external, ...rest}) => {

  if (external || IS_EXTERNAL_LINK_REGEX.test(url)) {
    rest.target = "_blank";
    rest.rel = "noopener noreferrer";
    return (
      <a href={url} {...rest}>
        {children}
      </a>
    );
  }

   return (
     <button
       // href={url}
       url={url}
       onClick={() => {
         console.log('Custom link clicked')
       }}
       {...rest}
     >
       {children}
     </button>
   );
 };

 export default CustomLinkComponent;
