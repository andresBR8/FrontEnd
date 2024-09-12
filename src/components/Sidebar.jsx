import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
// Icons
import {
  RiBarChart2Line,
  RiEarthLine,
  RiCustomerService2Line,
  RiCalendarTodoLine,
  RiLogoutCircleRLine,
  RiArrowRightSLine,
  RiMenu3Line,
  RiCloseLine,
} from "react-icons/ri";


const Sidebar = () => {
  const [showMenu, setShowMenu] = useState(false);
  const [showSubmenu, setShowSubmenu] = useState(false);
  const [showSubmenu2, setShowSubmenu2] = useState(false);
  const [showSubmenu3, setShowSubmenu3] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();
  const [menuHeight, setMenuHeight] = useState('0');

  useEffect(() => {
    const role = localStorage.getItem('role');
    setUserRole(role);
    if (role === 'Administrador') {
      setMenuHeight('170px');  // Altura para el rol 3
    } else {
      setMenuHeight('50px');   // Altura estándar para otros roles
    }
  }, []);

  const shouldHideMenu = userRole === 'Encargado' || userRole === 'Personal';
  const shouldHideMenu2 = userRole === 'Personal';
  const shouldHideMenu3 = userRole === 'Encargado' || userRole === 'Personal' || userRole === 'Administrador';

  const handleLogout = () => {
    localStorage.clear();  // Esto elimina todos los elementos de localStorage
    navigate("/login");  
  };
  

  return (
    <>
      <div
        className={`xl:h-[100vh] overflow-y-scroll fixed xl:static w-[80%] md:w-[40%] lg:w-[30%] xl:w-auto h-full top-0 bg-secondary-100 p-4 flex flex-col justify-between z-50 ${
          showMenu ? "left-0" : "-left-full"
        } transition-all`}
      >
      <div>
          
      <div className="flex justify-center">
  <Link
    to="/"
    className="text-center text-2xl font-bold text-emi_amarillo mb-10 py-2 px-4 border-l border-gray-500 ml-6 block relative before:w-3 before:h-3 before:absolute before:bg-primary before:rounded-full before:-left-[6.5px] before:top-1/2 before:-translate-y-1/2 before:border-4 before:border-secondary-100 hover:text-white transition-colors"
  >
    EMI
  </Link>
</div>
          
          <ul>

          <li>
          {!shouldHideMenu && (
              <button
                onClick={() => setShowSubmenu(!showSubmenu)}
                className="w-full flex items-center justify-between py-2 px-4 rounded-lg hover:bg-emi_azul transition-colors"
              >
                <span className="flex items-center gap-4 text-primary">
                  <RiBarChart2Line className="text-secondary-900" /> Usuarios
                </span>
                <RiArrowRightSLine
                  className={`mt-1 ${
                    showSubmenu && "rotate-90"
                  } transition-all`}
                />
              </button>
              )}
              {!shouldHideMenu && (
              <ul
                className={` ${
                  showSubmenu ? "h-[50px]" : "h-0"
                } overflow-y-hidden transition-all`}
              >
                <li>
                  <Link
                    to="/usuarios"
                    className="py-2 px-4 border-l border-gray-500 ml-6 block relative before:w-3 before:h-3 before:absolute before:bg-primary before:rounded-full before:-left-[6.5px] before:top-1/2 before:-translate-y-1/2 before:border-4 before:border-secondary-100 hover:text-white transition-colors"
                  >
                    Gestionar Usuarios
                  </Link>
                </li>
              </ul>
              )}
            </li>
            <li>
              <button
                onClick={() => setShowSubmenu2(!showSubmenu2)}
                className="w-full flex items-center justify-between py-2 px-4 rounded-lg hover:bg-emi_azul transition-colors"
              >
                <span className="flex items-center gap-4 text-primary">
                  <RiEarthLine className="text-secondary-900" /> Activos
                </span>
                <RiArrowRightSLine
                  className={`mt-1 ${
                    showSubmenu2 && "rotate-90"
                  } transition-all`}
                />
              </button>
              <ul className={`${showSubmenu2 ? menuHeight : 'h-0'} overflow-y-hidden transition-all`}> 
                <li>
                  <Link
                    to="/activos"
                    className="py-2 px-4 border-l border-gray-500 ml-6 block relative before:w-3 before:h-3 before:absolute before:bg-primary before:rounded-full before:-left-[6.5px] before:top-1/2 before:-translate-y-1/2 before:border-4 before:border-secondary-100 hover:text-white transition-colors"
                  >
                    Gestionar Activos
                  </Link>
                </li>
                {!shouldHideMenu2 && (
                <li>
                  <Link
                    to="/gestionaractivos"
                    className="py-2 px-4 border-l border-gray-500 ml-6 block relative before:w-3 before:h-3 before:absolute before:bg-primary before:rounded-full before:-left-[6.5px] before:top-1/2 before:-translate-y-1/2 before:border-4 before:border-secondary-100 hover:text-white transition-colors"
                  >
                    Asignación de Activos
                  </Link>
                </li>
                )}
                {!shouldHideMenu2 && (
                <li>
                  <Link
                    to="/devolveractivos"
                    className="py-2 px-4 border-l border-gray-500 ml-6 block relative before:w-3 before:h-3 before:absolute before:bg-primary before:rounded-full before:-left-[6.5px] before:top-1/2 before:-translate-y-1/2 before:border-4 before:border-secondary-100 hover:text-white transition-colors"
                  >
                    Devolución de Activos
                  </Link>
                </li>
                )}
                {!shouldHideMenu2 && (
                <li>
                  <Link
                    to="/depreciacion"
                    className="py-2 px-4 border-l border-gray-500 ml-6 block relative before:w-3 before:h-3 before:absolute before:bg-primary before:rounded-full before:-left-[6.5px] before:top-1/2 before:-translate-y-1/2 before:border-4 before:border-secondary-100 hover:text-white transition-colors"
                  >
                    Depreciación
                  </Link>
                </li>
                )}
                
                {!shouldHideMenu2 && (
                <li>
                  <Link
                    to="/bajas"
                    className="py-2 px-4 border-l border-gray-500 ml-6 block relative before:w-3 before:h-3 before:absolute before:bg-primary before:rounded-full before:-left-[6.5px] before:top-1/2 before:-translate-y-1/2 before:border-4 before:border-secondary-100 hover:text-white transition-colors"
                  >
                    Bajas
                  </Link>
                </li>
                )}
                
                {!shouldHideMenu && (
                <li>
                  <Link
                    to="/reportes"
                    className="py-2 px-4 border-l border-gray-500 ml-6 block relative before:w-3 before:h-3 before:absolute before:bg-primary before:rounded-full before:-left-[6.5px] before:top-1/2 before:-translate-y-1/2 before:border-4 before:border-secondary-100 hover:text-white transition-colors"
                  >
                    Reportes
                  </Link>
                </li>
                )}
              </ul>
            </li>
            {!shouldHideMenu2 && (
            <li>
              <button
                onClick={() => setShowSubmenu3(!showSubmenu3)}
                className="w-full flex items-center justify-between py-2 px-4 rounded-lg hover:bg-emi_azul transition-colors"
              >
                <span className="flex items-center gap-4 text-primary">
                  <RiBarChart2Line className="text-secondary-900" /> Personal
                </span>
                <RiArrowRightSLine
                  className={`mt-1 ${
                    showSubmenu3 && "rotate-90"
                  } transition-all`}
                />
              </button>
              <ul
                className={` ${
                  showSubmenu3 ? "h-[50px]" : "h-0"
                } overflow-y-hidden transition-all`}
              >
                <li>
                  <Link
                    to="/unidades"
                    className="py-2 px-4 border-l border-gray-500 ml-6 block relative before:w-3 before:h-3 before:absolute before:bg-primary before:rounded-full before:-left-[6.5px] before:top-1/2 before:-translate-y-1/2 before:border-4 before:border-secondary-100 hover:text-white transition-colors"
                  >
                    Gestionar Personal
                  </Link>
                </li>
                
              </ul>
            </li>
            )}
            
            <li>
              <Link
                to="/calendario"
                className="text-primary flex items-center gap-4 py-2 px-4 rounded-lg hover:bg-black transition-colors"
              >
                <RiCalendarTodoLine className="text-secondary-900" /> Calendario
              </Link>
            </li>
          </ul>
        </div>
        <nav>
          <button
            onClick={handleLogout}
            className="flex items-center gap-4 py-2 px-4 rounded-lg hover:bg-black transition-colors text-emi_amarillo w-full"
          >
            <RiLogoutCircleRLine className="text-white" /> Cerrar sesión
          </button>
        </nav>
      </div>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="xl:hidden fixed bottom-4 right-4 bg-primary text-black p-3 rounded-full z-50"
      >
        {showMenu ? <RiCloseLine /> : <RiMenu3Line />}
      </button>
    </>
  );
};

export default Sidebar;
