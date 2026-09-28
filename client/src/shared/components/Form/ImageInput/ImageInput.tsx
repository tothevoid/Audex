import { Box, Button, Flex, Input, Image} from "@chakra-ui/react"
import { ChangeEvent, Fragment, useRef } from "react";
import { Nullable } from "@/shared/utilities/nullable";
import { MdFileUpload } from "react-icons/md";

interface ModalProps {
    imageUrl: Nullable<string>,
    onImageSelected: (url: string, image: File) => void;
};

const ImageInput: React.FC<ModalProps> = ({imageUrl, onImageSelected}) => {
    const inputRef = useRef<HTMLInputElement | null>(null);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0] || null;
        if (selectedFile) {
            const reader = new FileReader();
            reader.onloadend = () => {
                onImageSelected(reader.result as string, selectedFile)
            };
            reader.readAsDataURL(selectedFile);
        }
    };

    return <Flex marginBlock={5} alignItems={"center"} justifyContent={"center"}>
        <Box justifyContent={"center"} role="group" position="relative" boxSize="50px">
            <Input type="file" accept="image/*" onChange={handleFileChange} ref={inputRef} display="none" />
            {
                imageUrl ?
                    <Image src={imageUrl} boxSize="50px"
                        backgroundColor="black"
                        objectFit="contain"
                        borderColor="gray.200"
                        borderRadius="md"></Image>:
                    <Fragment/>
            }
            {/* Fix group hover */}
            <Button 
                background={"transparent"} 
                color="action_primary" 
                position="absolute"
                top="0"
                left="0"
                boxSize="50px"
                borderRadius="md"
                bg="whiteAlpha.400"
                opacity={imageUrl ? 0: 1}
                _groupHover={{ opacity: 1, bg: 'whiteAlpha.900' }}
                transition="opacity 0.2s"
                boxShadow="sm"
                onClick={() => inputRef.current?.click()} size="xl">
                <MdFileUpload/>
            </Button>
        </Box>
    </Flex>
    
}

export default ImageInput;