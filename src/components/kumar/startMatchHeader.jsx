import React from "react";
// import './index.css';
import logo from '../../assets/sophita/HomePage/Picture3_2.png';
class HeaderComponent extends React.Component{
    render(){
        return(
             <header className='flex w-full absolute top-3 z-10 h-[2rem] p-y-[1rem] pl-3'>
             <img className='h-15 w-15 md:h-10 object-contain block select-none' src={logo} alt="cricklytics logo" />
             <div className="flex justify-center items-center w-[5rem] h-[3rem] bg-yellow ml-[1.5rem]">
  <h1 className="text-white text-2xl font-bold">Cricklytics</h1>
</div>

                
            </header>
        )
    }
}
export default HeaderComponent;