import type { FC } from "react";
import { HeaderStyles } from "./Header.styles";

const Header:FC = () => {
    return (
        <h1 className={HeaderStyles.title}>QbitLab BMS</h1>
    );
}

export default Header;