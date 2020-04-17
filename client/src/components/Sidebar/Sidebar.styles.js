import styled from 'styled-components';
import { Nav, NavLink } from 'reactstrap';

export const NavStyled = styled(Nav)`
  min-width: 215px;
  max-width: 215px;
  width: 215px;
  background: #f4f4f4;
  border-right: 1px solid rgba(112, 112, 112, 0.25);
  padding-top: 20px;
`;

export const NavLinkStyled = styled(NavLink)`
  color: #707070;

  &.active {
    background: #dfdaf5;
  }
`;

export const SidebarLinkContent = styled.div`
  padding-left: 20px;
  display: flex;
  align-items: center;
`;

export const SidebarLinkText = styled.span`
  padding-left: 20px;
  font-size: 0.78em;
  font-weight: 500;
`;

export const NavIcon = styled.i`
  font-size: 1.5em;
  display: flex;
  height: 1em;
`;
