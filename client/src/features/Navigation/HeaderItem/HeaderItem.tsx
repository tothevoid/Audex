import { Text } from '@chakra-ui/react';
import './HeaderItem.scss';

type Props = {
    title: string
    active: boolean
}

const HeaderItem = (props: Props) => {
    const {title} = props;

    const additionalConfig = props.active ? {
        background: "background_primary",
        borderRadius: "10px"
    }: {}

    return <Text {...additionalConfig} color="text_primary" className="header-item">{title}</Text>
}

export default HeaderItem;