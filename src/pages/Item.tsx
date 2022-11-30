import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButton, IonList, IonInput, IonItem, IonItemGroup, IonItemDivider, IonLabel, IonSelect, IonCheckbox, IonSelectOption, NavContext } from '@ionic/react';
import { add } from 'ionicons/icons';
import { RouteComponentProps } from 'react-router-dom';
import { useDoc, useFind } from 'use-pouchdb';
import { useState, useEffect, useContext } from 'react';
import { useUpdateItem } from '../components/itemhooks';
import { cloneDeep } from 'lodash';
import './Item.css';

interface ItemPageProps
  extends RouteComponentProps<{
    id: string;
  }> {}

const Item: React.FC<ItemPageProps> = ({ match }) => {

  const [stateItemDoc,setStateItemDoc] = useState({});
  const updateItem  = useUpdateItem();

  const { doc: itemDoc, loading: itemLoading, state: itemState, error: itemError } = useDoc(match.params.id);

  const { docs: listDocs, loading: listLoading, error: listError} = useFind({
    index: { fields: ["type","name"] },
    selector: { type: "list", name: { $exists: true} },
    sort: [ "type","name"]
  });

  const { docs: categoryDocs, loading: categoryLoading, error: categoryError } = useFind({
      index: { fields: [ "type","name"] },
      selector: { type: "category", name: { $exists: true}},
      sort: [ "type","name"]
  });

  const {goBack} = useContext(NavContext);

  useEffect( () => {
    if (!itemLoading) {
      setStateItemDoc(itemDoc as any);
    }
  },[itemLoading,itemDoc]);

  if (itemLoading || listLoading || categoryLoading )  {return(
    <IonPage><IonHeader><IonToolbar><IonTitle>Loading...</IonTitle></IonToolbar></IonHeader></IonPage>
  )};
  
  function updateThisItem() {
    updateItem(stateItemDoc);
    goBack("/lists");
  }

  function updateCategory(catID: string) {
    setStateItemDoc({
      ...stateItemDoc,
      categoryID: catID
    });
  }

  function selectList(listID: string, updateVal: boolean) {
    let newItemDoc=cloneDeep(stateItemDoc);
    let listFound=false
    for (let i = 0; i < newItemDoc.lists.length; i++) {
      if (newItemDoc.lists[i].listID == listID) {
        newItemDoc.lists[i].active = updateVal;
        listFound=true;
        if(updateVal) {newItemDoc.lists[i].boughtCount++}
      }    
    }
    if (!listFound) {
      let listobj={
        listID: listID,
        boughtCount: 0,
        active: updateVal,
        checked: false
      }
      newItemDoc.lists.push(listobj);
    }
    setStateItemDoc(newItemDoc);
  }

  let listsElem=[];
  listsElem.push(<IonItemDivider key="listdivider">Item is on these lists:</IonItemDivider>)
  for (let i = 0; i < (stateItemDoc as any).lists.length; i++) {
    let listID = (stateItemDoc as any).lists[i].listID;
    let itemFoundIdx=listDocs.findIndex(element => (element._id === listID))
    let itemActive=((itemFoundIdx !== -1) && ((stateItemDoc as any).lists[i].active))
    let listName=(listDocs as any)[itemFoundIdx].name
//    console.log ({listID, itemFoundIdx, itemActive, listName});
    listsElem.push(
      <IonItem key={listID}>
        <IonCheckbox slot="start" onIonChange={(e: any) => selectList(listID,Boolean(e.detail.checked))} checked={itemActive}></IonCheckbox>
        <IonLabel>{listName}</IonLabel>
      </IonItem>
    )
  }

  
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Editing Item: {(stateItemDoc as any).name}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Editing Item: {(stateItemDoc as any).name}</IonTitle>
          </IonToolbar>
        </IonHeader>
          <IonList>
            <IonItem key="name">
              <IonLabel position="stacked">Name</IonLabel>
              <IonInput type="text" onIonChange={(e: any) => setStateItemDoc({...stateItemDoc, name: e.detail.value})} value={(stateItemDoc as any).name}></IonInput>
            </IonItem>
            <IonItem key="quantity">
              <IonLabel position="stacked">Quantity</IonLabel>
              <IonInput type="number" min="0" max="9999" onIonChange={(e: any) => setStateItemDoc({...stateItemDoc, quantity: e.detail.value})} value={(stateItemDoc as any).quantity}></IonInput>
            </IonItem>
            <IonItem key="category">
              <IonLabel position="stacked">Category</IonLabel>
              <IonSelect onIonChange={(ev) => updateCategory(ev.detail.value)} value={(stateItemDoc as any).categoryID}>
                {categoryDocs.map((cat) => (
                    <IonSelectOption key={cat._id} value={(cat as any)._id}>
                      {(cat as any).name}
                    </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>
            {listsElem}
          </IonList>
          <IonButton onClick={() => updateThisItem()}>Update</IonButton>
          <IonButton onClick={() => goBack("/lists")}>Cancel</IonButton>
      </IonContent>
    </IonPage>
  );
};

export default Item;
