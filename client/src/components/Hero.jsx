import { forwardRef } from "react";
import styles from "../style";
import { Landing } from "../assets";

const Hero = forwardRef(({ fileUploadRef }, ref) => (
  <section id="home" className={`flex md:flex-row flex-col ${styles.paddingY} w-100%`}>
    <div className={`flex-1 ${styles.flexStart} flex-col xl:px-0 sm:px-16 px-5`}>
      <div className="flex flex-row justify-between items-center w-full">
        <h1 className="flex-1 font-kaisei Opti font-bold ss:text=[72px] text-[90px]">
          Secure <br className="sm:block" />
          {" "}
          <span className="bg-purple-gradient">Your Data</span><br />
          {" "}
          With Us
        </h1>
      </div>

      <p className={`${styles.paragraph} max-w-[470px] text-primary font-semibold mt-8`}>
        Experience seamless data privacy with our web app—mask and unmask files effortlessly, ensuring your sensitive information remains secure while maintaining its analytical value.
      </p>
      <button
        className="bg-[#BB7CD3] cursor-pointer font-bold text-white w-[150px] h-[40px] rounded-full mt-2"
        onClick={() => {
          if (fileUploadRef?.current) {
            fileUploadRef.current.scrollIntoView({ behavior: "smooth" });
          }
        }}
      >
        Get Started
      </button>
    </div>

    <div className="flex-1 pt-15" style={{ position: 'relative', height: 'auto' }}>
      <img
        src={Landing}
        alt="cloud"
        style={{
          width: '100%',
          height: '90%',
          objectFit: 'cover', // Ensures the image maintains its aspect ratio
          marginTop: '10px',
          zIndex: 5
        }}
      />
    </div>
  </section>
));

export default Hero;
