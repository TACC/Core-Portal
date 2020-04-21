import styled from 'styled-components';
import { Nav, NavLink } from 'reactstrap';

const NavStyled = styled(Nav)`
  min-width: 215px;
  max-width: 215px;
  width: 215px;
  background: #f4f4f4;
  border-right: 1px solid rgba(112, 112, 112, 0.25);
  padding-top: 20px;
`;
NavStyled.defaultProps = { 'data-id': 'NavStyled' };

const NavLinkStyled = styled(NavLink)`
  color: #707070;

  &.active {
    background: #dfdaf5;
  }
  /* Override Bootstrap 'a:hover' */
  &:hover {
    color: #707070;
  }
`;
NavLinkStyled.defaultProps = { 'data-id': 'NavLinkStyled' };

const SidebarLinkContent = styled.div`
  padding-left: 20px;
  display: flex;
  align-items: center;
`;
SidebarLinkContent.defaultProps = { 'data-id': 'SidebarLinkContent' };

const SidebarLinkText = styled.span`
  padding-left: 20px;
  font-size: 0.78em;
  font-weight: 500;
`;
SidebarLinkText.defaultProps = { 'data-id': 'SidebarLinkText' };

const NavIcon = styled.i`
  font-size: 1.5em;
  display: flex;
  height: 1em;
`;
NavIcon.defaultProps = { 'data-id': 'NavIcon' };

export {
  NavStyled,
  NavLinkStyled,
  SidebarLinkContent,
  SidebarLinkText,
  NavIcon
};
