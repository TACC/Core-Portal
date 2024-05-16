import React, { useEffect, useState } from 'react';
import {
    Button,
    ShowMore,
    LoadingSpinner,
    SectionMessage,
    SectionTableWrapper,
    DescriptionList,
    Section,
    SectionContent,
    Expand
  } from '_common';
  import {
    Link, useRouteMatch
  } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Wizard from '_common/Wizard';
import styles from './DataFilesProjectPublish.module.scss'
import { fetchUtil } from 'utils/fetchUtil';
import { TreeItem, TreeView } from '@material-ui/lab';
import Icon from '_common/Icon';
import * as ROUTES from '../../../../constants/routes';
import { createAnalysisDataModalHandler, createOriginDataModalHandler, createSampleModalHandler } from '../utils/datasetFormHandlers';
import DataDisplay from '../utils/DataDisplay/DataDisplay';


const DataFilesProjectPublish = ({ system, path, api, scheme }) => {

    const portalName = 'drp';
    const projectId = 'CEPV3-DEV-1133';

    const getTree = async (projectId, portalName) => {
        const response = await fetchUtil({
            url: `api/${portalName.toLowerCase()}/tree`,
            params: {
            project_id: projectId,
            },
        });
    
        return response;
    }

    const [tree, setTree] = useState([]);
    const [expandedNodes, setExpandedNodes] = useState([]);

    const handleNodeToggle = (event, nodeIds) => {
        // Update the list of expanded nodes
        setExpandedNodes(nodeIds);
      };

    useEffect(async () => {
        const response = await getTree(projectId, portalName);
        setTree(response);
    }, [projectId, portalName])


    const dispatch = useDispatch();

    useEffect(() => {
        dispatch({
          type: 'PROJECTS_GET_METADATA',
          payload: system,
        });
    }, [system]);

    const metadata = useSelector((state) => state.projects.metadata);

    const formSubmit = (values) => {
        console.log("DataFilesProjectPublish: formSubmit: ", values);
    }

    const onEdit = () => {
        dispatch({
          type: 'DATA_FILES_TOGGLE_MODAL',
          payload: { operation: 'editproject', props: {} },
        });
    };

    const handleSampleModal = createSampleModalHandler(dispatch);
    const handleOriginDataModal = createOriginDataModalHandler(dispatch, projectId, portalName);
    const handleAnalysisDataModal = createAnalysisDataModalHandler(dispatch, projectId, portalName);

    const onEditData = (node) => {

        const dataType = node.metadata.data_type;
        // reconstruct editFile to mimic SelectedFile object
        const editFile = {
          "format": "folder",
          "id" : node.path,
          "metadata": node.metadata,
          "name": node.metadata.name,
          "system": system,
          "path": node.path,
          "type": "dir",
          "_links": {
            "self": {
              "href": "tapis://" + node.path,
            },
          }
        };
        switch (dataType) {
          case 'sample':
            handleSampleModal('EDIT_SAMPLE_DATA', editFile);
            break;
          case 'origin_data':
            handleOriginDataModal('EDIT_ORIGIN_DATASET', editFile);
            break;
          case 'analysis_data':
            handleAnalysisDataModal('EDIT_ANALYSIS_DATASET', editFile);
            break;
            case 'file':
                // Dispatch an action to toggle the modal for previewing the file
                dispatch({
                    type: 'DATA_FILES_TOGGLE_MODAL',
                    payload: {
                        operation: 'preview',
                        props: {
                            api,
                            scheme,
                            system,
                            path: node.path,
                            name: node.metadata.name, // Assuming 'name' is from node.metadata
                            href: "tapis://" + node.path,
                            length: node.metadata.length, // Assuming 'length' is from node.metadata
                            metadata: node.metadata,
                        },
                    },
                });
                break;
          default:
            break;
        }
      }

    const renderTree = (node) => (
        <>
            <Section 
                className={styles['prj']}
                contentLayoutName="oneColumn">
                <div>
                    
                    <TreeItem 
                        key={node.id} 
                        nodeId={node.id} 
                        label={
                            // <div className={styles['tree-content']}>
                                node.name
                                
                            // </div>
                        } 
                        classes={{label: styles['tree-label'], root: styles['tree-root'], content: styles['tree-content']}}
                        onLabelClick={() => handleNodeToggle}
                    >
                        {expandedNodes.includes(node.id) && (
                            <div className={styles['description-div']}>
                                <Button type="link" onClick={() => onEditData(node)}>
                                    {node.metadata.data_type === 'file' ? 'View' : 'Edit'}
                                </Button>
                                <div className={styles['description']}>
                                    <ShowMore>
                                        {node.metadata.description}
                                    </ShowMore>
                                    <DataDisplay data={node.metadata} excludeKeys={['description', 'data_type', 'sample', 'base_origin_data']} />
                                </div>
                            </div>
                        )}
                        {Array.isArray(node.children) && node.children.map((child) => (
                            renderTree(child)
                        ))}
                    </TreeItem>
                    

                </div>
            </Section>
            
        </>
    );

    const getAllNodeIds = (nodes) => {
        const ids = [];
        nodes.forEach(node => {
            ids.push(node.id);
            if (Array.isArray(node.children)) {
            ids.push(...getAllNodeIds(node.children));
            }
        });
        return ids;
    };


    console.log("DataFilesProjectPublish: metadata: ", metadata);

    const steps = [
        {
            id: 'publication_instructions',
            name: 'Publication Instructions',
            render: (
                <SectionTableWrapper
                    header={
                        <div className={styles.title}>
                            Instructions
                        </div>
                    }
                >
                <Section contentLayoutName={'oneColumn'}>
                    <p>
                        You are requesting to publish this project. By publishing your project, 
                        it will be available to anyone to view and download the project data and metadata.
                        <b> Please note:</b> once a project is published it is no longer editable!
                    </p>
                    <p>
                        You will begin the process of reviewing your data publication. 
                        This publication represents your unique research. You are the person that 
                        best knows your data and how to present it to the public. The system will 
                        help you through the process. Please complete the form below to begin the publication process.
                    </p>
                    <p>
                        Before publication, please corroborate with the main author of the project who else 
                        should be added as author of this publication and the order in which authors should be added.
                    </p>
                </Section>
                </SectionTableWrapper>
            ),
            initialValues: {}
        },
        {
            id: 'project_description',
            name: 'Project Description',
            render: (
                <SectionTableWrapper
                    header={
                        <div className={styles.title}>
                            Proofread Project
                        </div>
                    }
                    headerActions={
                        <div className={styles.controls}>
                            <>
                                <Button type="link" onClick={onEdit}>
                                    Edit Project
                                </Button>
                            </>
                        </div>
                    }
                >
                    <DescriptionList
                        data={{
                            Title: metadata.title,
                            Created: metadata.created,
                            Abstract: <ShowMore> {metadata.description} </ShowMore>,
                        }}
                        direction={'vertical'}
                    />
                </SectionTableWrapper>
            ),
            initialValues: {}
        }, 
        {
            id: 'project_structure',
            name: 'Review Project Structure',
            render: (
                <SectionTableWrapper
                    header={
                        <div className={styles.title}>
                            Review Project Structure
                        </div>
                    }
                    headerActions={
                        <div className={styles.controls}>
                            <>
                                <Button type="link" onClick={onEdit}>
                                    Edit Project
                                </Button>
                            </>
                        </div>
                    }
                >
                    {tree && tree.length > 0 &&
                        
                            <TreeView
                                defaultCollapseIcon={<Icon name={'contract'} />}
                                defaultExpandIcon={<Icon name={'expand'} />}
                                // expanded={getAllNodeIds(tree)}
                                onNodeToggle={handleNodeToggle}
                            >
                                {tree.map((node) => renderTree(node))}
                            </TreeView>
                        } 
                </SectionTableWrapper>
            ), 
            initialValues: {}
        }
    ]


    // do the wizard now

    return (
        <SectionTableWrapper
            className={styles.root}
            header={
                <div className={styles.title}>
                    Request Project Publication | {metadata.title}
                </div>
            }
            headerActions={
                <div className={styles.controls}>
                    <>
                        <Link className="wb-link" 
                            to={`${ROUTES.WORKBENCH}${ROUTES.DATA}/tapis/projects/${system}`}>Back to Project
                        </Link>
                    </>
                </div>
            
            }
        >
            <Wizard steps={steps} formSubmit={formSubmit} />

        </SectionTableWrapper>
    );

}

export default DataFilesProjectPublish;